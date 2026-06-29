'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

import { withLocalePath, type Locale } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

type LocalizedLinkProps = ComponentProps<typeof NextLink>;

function localizeHref(href: LocalizedLinkProps['href'], locale: Locale): LocalizedLinkProps['href'] {
  if (typeof href === 'string') {
    if (href.startsWith('/') && !href.startsWith('//')) {
      return withLocalePath(href, locale);
    }
    return href;
  }

  if (typeof href === 'object' && href !== null && 'pathname' in href && typeof href.pathname === 'string') {
    return {
      ...href,
      pathname: withLocalePath(href.pathname, locale),
    };
  }

  return href;
}

export function LocalizedLink({ href, ...rest }: LocalizedLinkProps) {
  const { locale } = useTranslation();
  return <NextLink href={localizeHref(href, locale)} {...rest} />;
}
