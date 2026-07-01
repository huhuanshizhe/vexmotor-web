'use client';

import { useState, useTransition } from 'react';

import type { AccountOrderDetail, AccountOrderRefundInput } from '@/lib/account-orders-api';

type OrderRefundRequestDialogProps = {
  order: Pick<AccountOrderDetail, 'orderNumber' | 'totalAmount' | 'currencyCode'>;
  onClose: () => void;
  onSubmit: (payload: AccountOrderRefundInput) => Promise<void>;
};

export function OrderRefundRequestDialog({ order, onClose, onSubmit }: OrderRefundRequestDialogProps) {
  const [refundType, setRefundType] = useState<'full_refund' | 'partial_refund'>('full_refund');
  const [returnType, setReturnType] = useState<'return_goods' | 'no_return'>('no_return');
  const [reason, setReason] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await onSubmit({
          refundType,
          returnType,
          reason: reason.trim(),
          requestedAmount: refundType === 'partial_refund' ? requestedAmount.trim() : undefined,
        });
        onClose();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to submit refund request.');
      }
    });
  }

  return (
    <div className="account-order-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="account-order-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="refund-dialog-title" style={{ margin: 0 }}>Request refund</h2>
          <p className="section-description">Order {order.orderNumber}. Operations will review your request.</p>
        </div>

        <form className="inquiry-form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Refund type</span>
            <select className="form-input" value={refundType} onChange={(event) => setRefundType(event.target.value as 'full_refund' | 'partial_refund')}>
              <option value="full_refund">Full refund</option>
              <option value="partial_refund">Partial refund</option>
            </select>
          </label>

          <label className="form-field">
            <span>Return goods?</span>
            <select className="form-input" value={returnType} onChange={(event) => setReturnType(event.target.value as 'return_goods' | 'no_return')}>
              <option value="no_return">No return</option>
              <option value="return_goods">Return goods</option>
            </select>
          </label>

          {refundType === 'partial_refund' ? (
            <label className="form-field">
              <span>Requested amount ({order.currencyCode})</span>
              <input
                className="form-input"
                value={requestedAmount}
                onChange={(event) => setRequestedAmount(event.target.value)}
                placeholder={`Max ${order.totalAmount}`}
                required
              />
            </label>
          ) : null}

          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Reason</span>
            <textarea
              className="form-input form-textarea"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the issue and what you need refunded"
              required
            />
          </label>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="account-order-dialog__actions" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="button-secondary" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="button-primary" disabled={isPending}>
              {isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
