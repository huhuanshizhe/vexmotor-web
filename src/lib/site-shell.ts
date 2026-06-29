import type {
  BrandStory,
  FooterContactBlock,
  HomeData,
  HomeFooterSection,
  NavigationData,
  NewsletterModule,
  StorefrontServiceHighlight,
} from '@/lib/storefront-types';

const productLinks = [
  {
    label: 'Stepper Motor',
    href: '/c/stepper-motor',
    children: [
      { label: 'Nema 8 Stepper Motor', href: '/c/nema-8-stepper-motor' },
      { label: 'Nema 11 Stepper Motor', href: '/c/nema-11-stepper-motor' },
      { label: 'Nema 14 Stepper Motor', href: '/c/nema-14-stepper-motor' },
      { label: 'Nema 16 Stepper Motor', href: '/c/nema-16-stepper-motor' },
      { label: 'Nema 17 Stepper Motor', href: '/c/nema-17-stepper-motor' },
      { label: 'Nema 23 Stepper Motor', href: '/c/nema-23-stepper-motor' },
      { label: 'Nema 24 Stepper Motor', href: '/c/nema-24-stepper-motor' },
      { label: 'Nema 34 Stepper Motor', href: '/c/nema-34-stepper-motor' },
    ],
  },
  { label: 'Power Supply', href: '/c/power-supply' },
  { label: 'Stepper Motor Driver', href: '/c/stepper-motor-driver' },
  { label: 'Closed Loop Stepper Motor', href: '/c/closed-loop-stepper-motor' },
  { label: 'Brushless Spindle Motor', href: '/c/brushless-spindle-motor' },
  { label: 'Brushless DC Motor', href: '/c/brushless-dc-motor' },
  { label: 'Integrated Stepper Motor', href: '/c/integrated-stepper-motor' },
];

/** Header Products dropdown + /categories page structure. */
export const catalogCategoryGroups = productLinks;

/** Homepage "Shop by Category" tiles — fixed secondary categories. */
export const homeShopByCategories = [
  { slug: 'nema-8-stepper-motor', name: 'Nema 8 Stepper Motor' },
  { slug: 'nema-11-stepper-motor', name: 'Nema 11 Stepper Motor' },
  { slug: 'nema-14-stepper-motor', name: 'Nema 14 Stepper Motor' },
  { slug: 'nema-16-stepper-motor', name: 'Nema 16 Stepper Motor' },
  { slug: 'nema-17-stepper-motor', name: 'Nema 17 Stepper Motor' },
  { slug: 'nema-23-stepper-motor', name: 'Nema 23 Stepper Motor' },
  { slug: 'nema-24-stepper-motor', name: 'Nema 24 Stepper Motor' },
  { slug: 'nema-34-stepper-motor', name: 'Nema 34 Stepper Motor' },
  { slug: 'power-supply', name: 'Power Supply' },
  { slug: 'stepper-motor-driver', name: 'Stepper Motor Driver' },
] as const;

export const storefrontNavigationBase: Omit<NavigationData, 'categories'> = {
  utilityLinks: [
    { label: 'cart', href: '/cart' },
    { label: 'Compare', href: '/compare' },
    { label: 'Wishlist', href: '/account/wishlist' },
    { label: 'Login', href: '/login' },
  ],
  mainLinks: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products', children: productLinks },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/company/about' },
    { label: 'Contact', href: '/contact' },
  ],
};

export const footerCopyright = '© 2026 StepMotech™ All Rights Reserved.';

export const footerPaymentMethods = ['Visa', 'MasterCard', 'American Express', 'Discover', 'PayPal'];

export const footerServiceHighlights: StorefrontServiceHighlight[] = [
  { title: 'Free Shipping', description: 'Free shipping and duties on orders $299+.' },
  { title: 'Easy Returns', description: 'Fast returns processed within 30 days.' },
  { title: 'Secure Payments', description: 'Multiple secure payment options available.' },
  { title: 'Reliable Support', description: 'Quick support during business hours.' },
];

export const footerNewsletter: NewsletterModule = {
  title: 'Subscribe To Our Newsletter!!',
  description: 'Be Aware of The Latest News, Special Offers and Discounts',
  placeholder: 'Enter Your E-mail Address...',
  buttonLabel: 'SUBSCRIBE',
};

export const footerBrandStory: BrandStory = {
  title: 'StepMotech',
  description:
    'StepMotech is a brand owned and operated by FA Dreamworks Ltd. For over two decades, FA Dreamworks has been a trusted automation partner to global leaders like Tesla, CATL, and the BMW Group. Our precision-engineered stepper motors combine industrial-grade performance with disruptive pricing, empowering smart manufacturing ecosystems and driving the global automation revolution.',
};

export const footerSections: HomeFooterSection[] = [
  {
    id: 'footer-products',
    title: 'Products',
    links: [
      { label: 'Nema 8 Stepper Motor', href: '/c/nema-8-stepper-motor' },
      { label: 'Nema 11 Stepper Motor', href: '/c/nema-11-stepper-motor' },
      { label: 'Nema 17 Stepper Motor', href: '/c/nema-17-stepper-motor' },
      { label: 'Nema 23 Stepper Motor', href: '/c/nema-23-stepper-motor' },
      { label: 'Nema 34 Stepper Motor', href: '/c/nema-34-stepper-motor' },
      { label: 'Stepper Motor Driver', href: '/c/stepper-motor-driver' },
      { label: 'View All Products', href: '/products' },
    ],
  },
  {
    id: 'footer-support',
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping & Delivery', href: '/support/shipping' },
      { label: 'Returns & Warranty', href: '/support/returns' },
      { label: 'Payment Methods', href: '/support/payment-methods' },
      { label: 'Track Order', href: 'https://www.17track.net/en', external: true },
    ],
  },
  {
    id: 'footer-company',
    title: 'Company',
    links: [
      { label: 'About Us', href: '/company/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'footer-legal',
    title: 'Legal',
    links: [
      { label: 'Terms of Sale', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
    ],
  },
];

export const footerContactBlocks: FooterContactBlock[] = [
  {
    title: 'Phone',
    lines: ['WhatsApp: +86-19952400441', 'Global Support: +1-518-722-7315'],
  },
  {
    title: 'Email',
    lines: ['support@stepmotech.online'],
    href: 'mailto:support@stepmotech.online',
  },
  {
    title: 'Operate Center',
    lines: ['UNIT B53, 2/F, KWAI SHING IND BLDG PHASE 1, 36-40 TAI LIN PAI ROAD, KWAI CHUNG, N.T. HONG KONG'],
  },
  {
    title: 'Technical Support Center & Warehouse',
    lines: ['UNIT B53, 2/F, KWAI SHING IND BLDG PHASE 1, 36-40 TAI LIN PAI ROAD, KWAI CHUNG, N.T. HONG KONG'],
  },
];

/** Static homepage/footer shell — merged with admin API dynamic product/category data. */
export const homeShell: HomeData = {
  heroBanners: [],
  featuredCategories: [],
  hotSale: [],
  newRelease: [],
  featuredIndustries: [],
  testimonials: [],
  trustHighlights: footerServiceHighlights,
  categoryGroups: [],
  sellingPoints: [],
  featuredShelves: [],
  mostViewedProducts: [],
  newsletter: footerNewsletter,
  brandStory: footerBrandStory,
  footerSections,
  footerContact: footerContactBlocks,
  paymentMethods: footerPaymentMethods,
  copyright: footerCopyright,
};

/** Header/footer navigation — fully owned by the web app, not the admin API. */
export function getStorefrontNavigation(): NavigationData {
  return { ...storefrontNavigationBase, categories: [] };
}
