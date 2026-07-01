import { redirect } from 'next/navigation';

import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';

export default async function AccountInquiriesRedirectPage() {
  const { locale } = await getServerSitePreferences();
  redirect(withLocalePath('/account/quotes', locale));
}
