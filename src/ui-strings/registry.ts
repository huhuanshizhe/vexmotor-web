import enTranslations from '@/locales/en.json';

export type UiStringRegistryEntry = {
  default: string;
  group: string;
  context?: string;
};

type NestedRecord = Record<string, unknown>;

function flattenTranslations(obj: NestedRecord, prefix = ''): Record<string, UiStringRegistryEntry> {
  const result: Record<string, UiStringRegistryEntry> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value as NestedRecord, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = {
        default: value,
        group: fullKey.split('.')[0] ?? 'common',
        context: '',
      };
    }
  }

  return result;
}

/** Site-shell strings not present in en.json — static UI shell only, no shipping method entities. */
const SITE_SHELL_EXTRAS: Record<string, UiStringRegistryEntry> = {
  'footer.shell.copyright': {
    default: '© 2026 StepMotech™ All Rights Reserved.',
    group: 'footer',
    context: 'Footer copyright line',
  },
  'footer.shell.newsletterTitle': {
    default: 'Subscribe To Our Newsletter!!',
    group: 'footer',
    context: 'Newsletter module title',
  },
  'footer.shell.newsletterDescription': {
    default: 'Be Aware of The Latest News, Special Offers and Discounts',
    group: 'footer',
  },
  'footer.shell.newsletterPlaceholder': {
    default: 'Enter Your E-mail Address...',
    group: 'footer',
  },
  'footer.shell.newsletterButton': {
    default: 'SUBSCRIBE',
    group: 'footer',
  },
  'footer.shell.brandTitle': {
    default: 'StepMotech',
    group: 'footer',
    context: 'Footer brand column title',
  },
  'footer.shell.brandDescription': {
    default:
      'StepMotech is a brand owned and operated by FA Dreamworks Ltd. For over two decades, FA Dreamworks has been a trusted automation partner to global leaders like Tesla, CATL, and the BMW Group. Our precision-engineered stepper motors combine industrial-grade performance with disruptive pricing, empowering smart manufacturing ecosystems and driving the global automation revolution.',
    group: 'footer',
  },
  'footer.section.products': { default: 'Products', group: 'footer', context: 'Footer column title' },
  'footer.section.support': { default: 'Support', group: 'footer', context: 'Footer column title' },
  'footer.section.company': { default: 'Company', group: 'footer', context: 'Footer column title' },
  'footer.section.legal': { default: 'Legal', group: 'footer', context: 'Footer column title' },
  'footer.service.freeShipping.title': { default: 'Free Shipping', group: 'footer' },
  'footer.service.freeShipping.description': {
    default: 'Free shipping and duties on orders $299+.',
    group: 'footer',
  },
  'footer.service.easyReturns.title': { default: 'Easy Returns', group: 'footer' },
  'footer.service.easyReturns.description': {
    default: 'Fast returns processed within 30 days.',
    group: 'footer',
  },
  'footer.service.securePayments.title': { default: 'Secure Payments', group: 'footer' },
  'footer.service.securePayments.description': {
    default: 'Multiple secure payment options available.',
    group: 'footer',
  },
  'footer.service.reliableSupport.title': { default: 'Reliable Support', group: 'footer' },
  'footer.service.reliableSupport.description': {
    default: 'Quick support during business hours.',
    group: 'footer',
  },
  'header.utility.cart': { default: 'Cart', group: 'header', context: 'Utility strip label' },
  'header.utility.quotes': { default: 'Quotes', group: 'header' },
  'header.utility.compare': { default: 'Compare', group: 'header' },
  'header.utility.wishlist': { default: 'Wishlist', group: 'header' },
  'header.utility.login': { default: 'Login', group: 'header' },
};

const fromEnJson = flattenTranslations(enTranslations as NestedRecord);

export const UI_STRING_REGISTRY: Record<string, UiStringRegistryEntry> = {
  ...fromEnJson,
  ...SITE_SHELL_EXTRAS,
};

export const UI_STRING_PREFETCH_GROUPS = [
  'common',
  'navigation',
  'header',
  'footer',
  'topbar',
  'categories',
  'cart',
  'checkout',
  'checkoutPage',
  'checkoutPayment',
  'compare',
  'comparePage',
  'account',
  'accountPortal',
  'filter',
  'product',
  'productDetail',
  'search',
  'catalog',
  'home',
  'loginPage',
  'faqPage',
  'wishlist',
  'quotePage',
  'addressForm',
  'blog',
] as const;

export function getRegistryDefault(key: string): string | undefined {
  return UI_STRING_REGISTRY[key]?.default;
}
