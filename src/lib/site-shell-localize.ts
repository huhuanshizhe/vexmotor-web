import type { HomeData } from '@/lib/storefront-types';

const TRUST_HIGHLIGHT_KEYS = [
  { title: 'footer.service.freeShipping.title', description: 'footer.service.freeShipping.description' },
  { title: 'footer.service.easyReturns.title', description: 'footer.service.easyReturns.description' },
  { title: 'footer.service.securePayments.title', description: 'footer.service.securePayments.description' },
  { title: 'footer.service.reliableSupport.title', description: 'footer.service.reliableSupport.description' },
] as const;

const FOOTER_SECTION_TITLE_KEYS: Record<string, string> = {
  'footer-products': 'footer.section.products',
  'footer-support': 'footer.section.support',
  'footer-company': 'footer.section.company',
  'footer-legal': 'footer.section.legal',
};

const UTILITY_LABEL_KEYS: Record<string, string> = {
  cart: 'header.utility.cart',
  Quotes: 'header.utility.quotes',
  Compare: 'header.utility.compare',
  Wishlist: 'header.utility.wishlist',
  Login: 'header.utility.login',
};

export function localizeHomeShell(homeData: HomeData, t: (key: string) => string): HomeData {
  return {
    ...homeData,
    trustHighlights: homeData.trustHighlights.map((item, index) => {
      const keys = TRUST_HIGHLIGHT_KEYS[index];
      if (!keys) return item;
      return {
        title: t(keys.title),
        description: t(keys.description),
      };
    }),
    newsletter: {
      ...homeData.newsletter,
      title: t('footer.shell.newsletterTitle'),
      description: t('footer.shell.newsletterDescription'),
      placeholder: t('footer.shell.newsletterPlaceholder'),
      buttonLabel: t('footer.shell.newsletterButton'),
    },
    brandStory: {
      title: t('footer.shell.brandTitle'),
      description: t('footer.shell.brandDescription'),
    },
    footerSections: homeData.footerSections.map((section) => ({
      ...section,
      title: FOOTER_SECTION_TITLE_KEYS[section.id] ? t(FOOTER_SECTION_TITLE_KEYS[section.id]) : section.title,
    })),
    copyright: t('footer.shell.copyright'),
  };
}

export function localizeUtilityLabel(label: string, t: (key: string) => string): string {
  const key = UTILITY_LABEL_KEYS[label];
  if (!key) return label;
  const translated = t(key);
  return translated === key ? label : translated;
}
