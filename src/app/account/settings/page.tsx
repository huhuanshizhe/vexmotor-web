'use client';

import { AccountSettingsClient } from '@/components/account/account-settings-client';
import { useAuth } from '@/components/providers/auth-provider';

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="section-description">Loading settings…</p>;
  }

  if (!user) {
    return null;
  }

  return <AccountSettingsClient />;
}
