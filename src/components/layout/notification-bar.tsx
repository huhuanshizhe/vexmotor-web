'use client';

import { useEffect, useState } from 'react';

import { LocalizedLink } from '@/components/i18n/localized-link';
import { cn } from '@/lib/classnames';
import { NOTIFICATION_BAR_STORAGE_KEY, notificationBarConfig } from '@/lib/site-config';

function readDismissedFromStorage() {
  try {
    return localStorage.getItem(NOTIFICATION_BAR_STORAGE_KEY) === notificationBarConfig.id;
  } catch {
    return false;
  }
}

function persistDismissedToStorage() {
  try {
    localStorage.setItem(NOTIFICATION_BAR_STORAGE_KEY, notificationBarConfig.id);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function NotificationBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readDismissedFromStorage()) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="notification-bar" role="status" aria-live="polite">
      <div className="notification-bar-inner">
        <p className="notification-bar-copy">{notificationBarConfig.message}</p>
        <div className="notification-bar-actions">
          <LocalizedLink href={notificationBarConfig.ctaHref} className="notification-bar-link">
            {notificationBarConfig.ctaLabel}
          </LocalizedLink>
          <button
            type="button"
            className={cn('notification-bar-dismiss')}
            onClick={() => {
              persistDismissedToStorage();
              setVisible(false);
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
