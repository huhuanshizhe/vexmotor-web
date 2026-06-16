'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error for diagnostics; replace with telemetry sink when available.
    console.error(error);
  }, [error]);

  return (
    <main className="section" role="alert" aria-live="assertive">
      <div className="section-inner" style={{ maxWidth: '720px', textAlign: 'center', paddingBlock: '4rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', opacity: 0.7 }}>
          Something went wrong
        </p>
        <h1 style={{ marginBlock: '0.75rem 1rem' }}>The storefront hit an unexpected error.</h1>
        <p style={{ opacity: 0.8 }}>
          Your data is safe. You can retry the action, or head back to a stable page while we recover.
        </p>
        {error.digest ? (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>Reference: {error.digest}</p>
        ) : null}
        <div className="cookie-consent-actions" style={{ justifyContent: 'center', marginTop: '1.75rem' }}>
          <button type="button" className="button-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="button-secondary page-button-secondary-dark">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
