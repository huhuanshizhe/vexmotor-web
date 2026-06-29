import { redirectLocalized } from '@/lib/i18n-server';

export default async function AboutRedirectPage() {
  await redirectLocalized('/company/about');
}

