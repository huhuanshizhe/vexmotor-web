import { redirectLocalized } from '@/lib/i18n-server';

export default async function TermsRedirect() {
  await redirectLocalized('/legal/terms');
}
