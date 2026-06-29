import { redirectLocalized } from '@/lib/i18n-server';

export default async function TechFaqRedirect() {
  await redirectLocalized('/faq?tab=technical');
}
