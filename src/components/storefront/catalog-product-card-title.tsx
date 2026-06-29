'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type CatalogProductCardTitleProps = {
  href: string;
  name: string;
};

export function CatalogProductCardTitle({ href, name }: CatalogProductCardTitleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => {
      const link = linkRef.current;
      if (link && link.scrollHeight > link.clientHeight + 1) {
        setShowTooltip(true);
      }
    }, 2000);
  }

  function handleMouseLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  }

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return (
    <h3 className="catalog-grid-card-title">
      <Link
        ref={linkRef}
        href={href}
        className="catalog-grid-card-title-link"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {name}
      </Link>
      {showTooltip ? (
        <span className="catalog-grid-title-tooltip" role="tooltip">
          {name}
        </span>
      ) : null}
    </h3>
  );
}
