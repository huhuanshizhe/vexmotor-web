'use client';

import { useEffect, useRef } from 'react';

import { PRODUCT_RICH_TEXT_STYLES } from '@/lib/product-rich-text-styles';

type IsolatedHtmlContentProps = {
  html: string;
  className?: string;
};

export function IsolatedHtmlContent({ html, className }: IsolatedHtmlContentProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${PRODUCT_RICH_TEXT_STYLES}</style><div class="product-rich-text">${html}</div>`;
  }, [html]);

  return <div ref={hostRef} className={className} />;
}
