import { redirect } from 'next/navigation';

export default function TechFaqRedirect() {
  redirect('/faq?tab=technical');
}
