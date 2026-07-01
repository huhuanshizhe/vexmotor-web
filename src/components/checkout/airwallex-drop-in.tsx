'use client';

import { init, createElement } from '@airwallex/components-sdk';
import { useEffect, useId, useRef, useState } from 'react';

type MountedDropInElement = {
  destroy: () => void;
  mount: (selector: string) => void;
  on: (event: 'ready' | 'success' | 'error', handler: (event?: unknown) => void) => void;
};

type AirwallexDropInProps = {
  intentId: string;
  clientSecret: string;
  currency: string;
  env: 'demo' | 'prod';
  onReady?: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function AirwallexDropIn({
  intentId,
  clientSecret,
  currency,
  env,
  onReady,
  onSuccess,
  onError,
}: AirwallexDropInProps) {
  const reactId = useId();
  const containerId = `airwallex-drop-in-${reactId.replace(/:/g, '')}`;
  const elementRef = useRef<MountedDropInElement | null>(null);
  const onReadyRef = useRef(onReady);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [isMounting, setIsMounting] = useState(true);

  onReadyRef.current = onReady;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function mountDropIn() {
      setIsMounting(true);

      try {
        await init({
          env,
          enabledElements: ['payments'],
        });

        if (cancelled) {
          return;
        }

        elementRef.current?.destroy();
        elementRef.current = null;

        const element = (await createElement('dropIn', {
          intent_id: intentId,
          client_secret: clientSecret,
          currency: currency.toUpperCase(),
          methods: ['card'],
        })) as MountedDropInElement;

        if (cancelled) {
          element.destroy();
          return;
        }

        element.mount(containerId);

        element.on('ready', () => {
          if (!cancelled) {
            setIsMounting(false);
            onReadyRef.current?.();
          }
        });

        element.on('success', () => {
          if (!cancelled) {
            onSuccessRef.current();
          }
        });

        element.on('error', (event: unknown) => {
          if (!cancelled) {
            const detail = (event as { detail?: { error?: { message?: string } } } | undefined)?.detail;
            const message =
              typeof detail?.error?.message === 'string'
                ? detail.error.message
                : 'Payment failed. Please check your card details and try again.';
            onErrorRef.current(message);
          }
        });

        elementRef.current = element;
      } catch (error) {
        if (!cancelled) {
          setIsMounting(false);
          onErrorRef.current(error instanceof Error ? error.message : 'Unable to load payment form.');
        }
      }
    }

    void mountDropIn();

    return () => {
      cancelled = true;
      elementRef.current?.destroy();
      elementRef.current = null;
    };
  }, [intentId, clientSecret, currency, env, containerId]);

  return (
    <div className="checkout-airwallex-dropin">
      {isMounting ? <p className="payment-gateway-loading">Loading secure payment form…</p> : null}
      <div id={containerId} />
    </div>
  );
}
