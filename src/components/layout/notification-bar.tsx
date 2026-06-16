'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/classnames';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { NOTIFICATION_BAR_COOKIE_MAX_AGE, NOTIFICATION_BAR_COOKIE_NAME, notificationBarConfig } from '@/lib/site-config';

type NotificationBarProps = {
  locale: Locale;
  initiallyDismissed: boolean;
};

export function NotificationBar({ locale, initiallyDismissed }: NotificationBarProps) {
  const [dismissed, setDismissed] = useState(initiallyDismissed);
  const href = useMemo(() => withLocalePath(notificationBarConfig.ctaHref, locale), [locale]);

  if (dismissed) {
    return null;
  }

  return (
    <div className="notification-bar" role="status" aria-live="polite">
      <div className="notification-bar-inner">
        <p className="notification-bar-copy">{notificationBarConfig.message}</p>
        <div className="notification-bar-actions">
          <Link href={href} className="notification-bar-link">
            {notificationBarConfig.ctaLabel}
          </Link>
          <button
            type="button"
            className={cn('notification-bar-dismiss', dismissed && 'is-hidden')}
            onClick={() => {
              document.cookie = `${NOTIFICATION_BAR_COOKIE_NAME}=${notificationBarConfig.id}; Path=/; Max-Age=${NOTIFICATION_BAR_COOKIE_MAX_AGE}; SameSite=Lax`;
              setDismissed(true);
            }}
            aria-label="Dismiss site notification"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}