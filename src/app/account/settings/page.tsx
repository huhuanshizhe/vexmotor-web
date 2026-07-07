'use client';

import { Suspense } from 'react';

import { AccountSettingsClient } from '@/components/account/account-settings-client';
import { useAuth } from '@/components/providers/auth-provider';

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading && !user) {
    return <p className="section-description">Loading settings…</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <Suspense fallback={<p className="section-description">Loading settings…</p>}>
      <AccountSettingsClient />
    </Suspense>
  );
}
