'use client';

import { Suspense } from 'react';

import AuthCallbackPage from './callback-inner';

export default function AuthCallbackPageWrapper() {
  return (
    <Suspense fallback={<p className="section-description">Signing you in…</p>}>
      <AuthCallbackPage />
    </Suspense>
  );
}
