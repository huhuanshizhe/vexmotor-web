'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { setAccessToken } from '@/lib/api-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token') ?? searchParams.get('accessToken');
    const redirect = searchParams.get('redirect') ?? searchParams.get('callbackUrl') ?? '/account';

    if (token) {
      setAccessToken(token);
    }

    router.replace(redirect.startsWith('/') ? redirect : '/account');
  }, [router, searchParams]);

  return (
    <main className="section">
      <div className="section-inner">
        <p className="section-description">Signing you in…</p>
      </div>
    </main>
  );
}
