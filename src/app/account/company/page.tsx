'use client';

import { AccountCompanyClient } from '@/components/account/account-company-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslation } from '@/lib/i18n-context';

export default function AccountCompanyPage() {
  const { user } = useAuth();
  const { locale } = useTranslation();

  if (!user) {
    return null;
  }

  return <AccountCompanyClient locale={locale} />;
}
