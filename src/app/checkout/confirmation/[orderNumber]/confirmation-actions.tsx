'use client';

import Link from 'next/link';

type ConfirmationActionsProps = {
  continueShoppingHref: string;
  createAccountHref?: string;
};

export function ConfirmationActions({ continueShoppingHref, createAccountHref }: ConfirmationActionsProps) {
  return (
    <div className="confirmation-actions">
      <button type="button" className="button-secondary" onClick={() => window.print()}>
        Print this page
      </button>
      <button type="button" className="button-secondary" disabled>
        View invoice (PDF)
      </button>
      <Link href={continueShoppingHref} className="button-primary">
        Continue shopping
      </Link>
      {createAccountHref ? (
        <Link href={createAccountHref} className="nav-link">
          Create account to track
        </Link>
      ) : null}
    </div>
  );
}