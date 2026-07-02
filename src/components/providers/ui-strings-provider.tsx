'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

type UiStringsContextValue = {
  strings: Record<string, string>;
  getString: (key: string) => string | undefined;
};

const UiStringsContext = createContext<UiStringsContextValue | null>(null);

export function UiStringsProvider({
  children,
  initialStrings = {},
}: {
  children: ReactNode;
  initialStrings?: Record<string, string>;
}) {
  const getString = useCallback(
    (key: string) => initialStrings[key],
    [initialStrings],
  );

  const value = useMemo(
    () => ({ strings: initialStrings, getString }),
    [initialStrings, getString],
  );

  return <UiStringsContext.Provider value={value}>{children}</UiStringsContext.Provider>;
}

export function useUiStrings() {
  const context = useContext(UiStringsContext);
  if (!context) {
    return { strings: {}, getString: () => undefined };
  }
  return context;
}

export function useUiString(key: string, fallback?: string) {
  const { getString } = useUiStrings();
  return getString(key) ?? fallback;
}
