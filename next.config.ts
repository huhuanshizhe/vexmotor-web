import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/company/distributors', destination: '/contact', permanent: true },
      { source: '/company/offices', destination: '/contact', permanent: true },
      { source: '/company/factory', destination: '/company/about', permanent: true },
      { source: '/support/clearance-duty', destination: '/support/shipping', permanent: true },
      { source: '/support/affiliate', destination: '/contact', permanent: true },
      { source: '/support/free-shipping', destination: '/support/shipping', permanent: true },
      { source: '/solutions', destination: '/products', permanent: true },
      { source: '/solutions/:path*', destination: '/products', permanent: true },
      { source: '/applications', destination: '/blog', permanent: true },
      { source: '/applications/:path*', destination: '/blog', permanent: true },
      { source: '/glossary', destination: '/faq', permanent: true },
      { source: '/resources', destination: '/products', permanent: true },
      { source: '/resources/:path*', destination: '/products', permanent: true },
      { source: '/company/certifications', destination: '/company/about', permanent: true },
      { source: '/company/careers', destination: '/company/about', permanent: true },
      { source: '/company/careers/:path*', destination: '/company/about', permanent: true },
      { source: '/company/press', destination: '/blog', permanent: true },
      { source: '/selector', destination: '/products', permanent: true },
      { source: '/support/after-sales', destination: '/faq', permanent: true },
      { source: '/support', destination: '/faq', permanent: true },
      { source: '/content/:path*', destination: '/blog', permanent: true },
      { source: '/custom', destination: '/contact', permanent: true },
      { source: '/sample', destination: '/contact', permanent: true },
      { source: '/legal/ip', destination: '/legal/privacy', permanent: true },
      { source: '/legal/cookies', destination: '/legal/privacy', permanent: true },
      { source: '/legal/export-compliance', destination: '/legal/terms', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'diiospp53gsun.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'machrio.oss-us-west-1.aliyuncs.com',
      },
    ],
  },
};

export default nextConfig;
