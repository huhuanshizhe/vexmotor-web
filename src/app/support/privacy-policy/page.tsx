import { redirectLocalized } from '@/lib/i18n-server';

export default async function PrivacyRedirect() {
  await redirectLocalized('/legal/privacy');
}
