'use client';

import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';

type NewsletterSignupFormProps = {
  placeholder: string;
  buttonLabel: string;
};

export function NewsletterSignupForm({ placeholder, buttonLabel }: NewsletterSignupFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setMessage(null);

      try {
        await apiFetch('/api/front/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        setEmail('');
        setMessage('Subscribed. You will receive updates from StepMotech.');
      } catch {
        setMessage('Unable to subscribe right now. Please try again.');
      }
    });
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="newsletter-input"
          placeholder={placeholder}
          aria-label="Email address"
          required
        />
        <button type="submit" className="button-primary" disabled={isPending}>
          {isPending ? 'Submitting...' : buttonLabel}
        </button>
      </form>
      {message ? <span className="section-description compact-copy">{message}</span> : null}
    </div>
  );
}