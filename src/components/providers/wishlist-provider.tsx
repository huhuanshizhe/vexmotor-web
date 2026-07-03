'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, getAccessToken } from '@/lib/api-client';

import { useAuth } from '@/components/providers/auth-provider';

type WishlistItem = {
  productId: string;
};

type WishlistContextValue = {
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<WishlistItem[]>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setProductIds(new Set());
      return;
    }

    if (loadPromiseRef.current) {
      await loadPromiseRef.current;
      return;
    }

    const promise = (async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ items: WishlistItem[] }>('/api/front/wishlist');
        setProductIds(new Set(data.items.map((entry) => entry.productId)));
      } catch {
        setProductIds(new Set());
      } finally {
        setIsLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    loadPromiseRef.current = promise;
    await promise;
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setProductIds(new Set());
      setIsLoading(false);
      return;
    }

    void refresh();
  }, [authLoading, isAuthenticated, refresh]);

  const addToWishlist = useCallback(async (productId: string) => {
    const data = await apiFetch<{ items: WishlistItem[] }>('/api/front/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    setProductIds(new Set(data.items.map((entry) => entry.productId)));
    return data.items;
  }, []);

  const isInWishlist = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const value = useMemo(
    () => ({
      isLoading: authLoading || isLoading,
      isInWishlist,
      addToWishlist,
      refresh,
    }),
    [authLoading, isLoading, isInWishlist, addToWishlist, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
