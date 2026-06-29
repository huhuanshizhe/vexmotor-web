import { redirectLocalized } from '@/lib/i18n-server';

export default async function CertificationPage() {
  await redirectLocalized('/company/certifications');
}
