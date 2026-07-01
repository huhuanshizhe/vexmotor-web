'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { fetchInquiryDetail, postInquiryMessage, type AccountInquiryDetail, type InquiryMessage } from '@/lib/inquiry-api';
import { subscribeInquiryMessages } from '@/lib/inquiry-messages-stream';
import type { Locale } from '@/lib/i18n';

type InquiryMessageDialogProps = {
  locale: Locale;
  inquiryId: string;
  quoteNumber: string;
  onClose: () => void;
};

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function InquiryMessageDialog({ locale, inquiryId, quoteNumber, onClose }: InquiryMessageDialogProps) {
  const [detail, setDetail] = useState<AccountInquiryDetail | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetchInquiryDetail(quoteNumber)
      .then((result) => {
        if (!active) {
          return;
        }
        messageIdsRef.current = new Set(result.messages.map((item) => item.id));
        setDetail(result);
      })
      .catch(() => {
        if (active) {
          setError('Unable to load messages.');
        }
      });
    return () => {
      active = false;
    };
  }, [quoteNumber]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    const lastMessageId = detail.messages.at(-1)?.id;
    const unsubscribe = subscribeInquiryMessages(
      quoteNumber,
      {
        onMessage: (message) => {
          if (messageIdsRef.current.has(message.id)) {
            return;
          }
          messageIdsRef.current.add(message.id);
          setDetail((current) => {
            if (!current) {
              return current;
            }
            return { ...current, messages: [...current.messages, message] };
          });
        },
      },
      { after: lastMessageId },
    );

    return unsubscribe;
  }, [detail?.id, quoteNumber]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [detail?.messages.length]);

  function handleSend() {
    if (!body.trim()) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const updated = await postInquiryMessage(inquiryId, body.trim());
        messageIdsRef.current = new Set(updated.messages.map((item) => item.id));
        setDetail(updated);
        setBody('');
      } catch {
        setError('Unable to send message.');
      }
    });
  }

  const messages: InquiryMessage[] = detail?.messages ?? [];

  return (
    <div className="account-quote-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="account-quote-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-message-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="account-quote-dialog__header">
          <div>
            <p className="account-quote-kicker">Message thread</p>
            <h2 id="inquiry-message-title" className="account-quote-dialog__title">{quoteNumber}</h2>
          </div>
          <button type="button" className="account-quote-dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="account-quote-dialog__body">
          <aside className="account-quote-dialog__meta">
            <div>
              <span className="account-quote-meta-label">Quote #</span>
              <strong className="account-quote-mono">{quoteNumber}</strong>
            </div>
            <div>
              <span className="account-quote-meta-label">Stage</span>
              <span className="account-quote-status-pill">{formatStatus(detail?.status ?? 'new')}</span>
            </div>
            {detail?.createdAt ? (
              <div>
                <span className="account-quote-meta-label">Created</span>
                <span>{new Date(detail.createdAt).toLocaleDateString(locale)}</span>
              </div>
            ) : null}
            <p className="account-quote-dialog__hint">Engineering and sales replies appear in real time.</p>
          </aside>

          <div className="account-quote-dialog__thread-wrap">
            <div ref={threadRef} className="account-quote-dialog__thread" role="log" aria-live="polite">
              {messages.length ? messages.map((message) => {
                const isCustomer = message.senderType === 'customer';
                return (
                  <article
                    key={message.id}
                    className={`account-quote-bubble${isCustomer ? ' is-customer' : ' is-admin'}`}
                  >
                    <header className="account-quote-bubble__head">
                      <strong>{isCustomer ? 'You' : 'STEPMOTECH'}</strong>
                      <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(locale)}</time>
                    </header>
                    <p className="account-quote-bubble__body">{message.body}</p>
                  </article>
                );
              }) : (
                <p className="account-quote-dialog__empty">No messages yet. Ask about lead time, pricing, or specifications.</p>
              )}
            </div>

            <footer className="account-quote-dialog__composer">
              <textarea
                className="account-quote-input"
                rows={3}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Type your message…"
                disabled={isPending}
              />
              {error ? <p className="account-quote-dialog__error">{error}</p> : null}
              <div className="account-quote-dialog__actions">
                <button type="button" className="button-primary" onClick={handleSend} disabled={isPending || !body.trim()}>
                  {isPending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
