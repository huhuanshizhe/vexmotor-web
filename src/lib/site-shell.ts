import type { FooterContactBlock, NavigationData } from '@/lib/storefront-types';

const productLinks = [
  {
    label: 'Stepper Motor',
    href: '/products',
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
