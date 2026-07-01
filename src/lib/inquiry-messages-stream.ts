import { getAccessToken, getApiBaseUrl } from '@/lib/api-client';
import type { InquiryMessage } from '@/lib/inquiry-api';

type StreamHandlers = {
  onMessage: (message: InquiryMessage) => void;
  onReady?: (data: { inquiryId: string; quoteNumber: string | null }) => void;
  onError?: () => void;
};

export function subscribeInquiryMessages(
  idOrQuoteNumber: string,
  handlers: StreamHandlers,
  options?: { after?: string },
): () => void {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (options?.after) {
    params.set('after', options.after);
  }
  const token = getAccessToken();
  if (token) {
    params.set('access_token', token);
  }
  const query = params.toString();
  const url = `${base}/api/front/inquiries/${encodeURIComponent(idOrQuoteNumber)}/messages/stream${query ? `?${query}` : ''}`;

  const source = new EventSource(url);
  const knownIds = new Set<string>();

  source.addEventListener('ready', (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as { inquiryId: string; quoteNumber: string | null };
      handlers.onReady?.(data);
    } catch {
      // ignore malformed ready payload
    }
  });

  source.addEventListener('message', (event) => {
    try {
      const message = JSON.parse((event as MessageEvent).data) as InquiryMessage;
      if (knownIds.has(message.id)) {
        return;
      }
      knownIds.add(message.id);
      handlers.onMessage(message);
    } catch {
      handlers.onError?.();
    }
  });

  source.addEventListener('error', () => {
    handlers.onError?.();
  });

  return () => {
    source.close();
  };
}
