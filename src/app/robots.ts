import type { MetadataRoute } from 'next';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, withLocalePath } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const blockedPaths = ['/account/', '/admin/', '/cart', '/checkout', '/search', '/compare', '/quote', '/sample', '/inquiries/'];
  const localizedBlockedPaths = SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).flatMap((locale) =>
    blockedPaths.map((path) => withLocalePath(path, locale)),
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...blockedPaths, ...localizedBlockedPaths],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
  };
}