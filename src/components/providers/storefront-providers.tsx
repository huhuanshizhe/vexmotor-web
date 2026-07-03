'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/providers/auth-provider';
import { WishlistProvider } from '@/components/providers/wishlist-provider';

/** Bundled client providers so Fast Refresh reloads auth + wishlist together. */
export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </AuthProvider>
  );
}
