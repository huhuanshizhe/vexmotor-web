type PaymentGatewayModeBadgeProps = {
  mode: 'test' | 'live';
  gateway: 'stripe' | 'airwallex';
};

const LABELS = {
  test: {
    stripe: 'Stripe sandbox',
    airwallex: 'Airwallex sandbox',
  },
  live: {
    stripe: 'Stripe live',
    airwallex: 'Airwallex live',
  },
} as const;

export function PaymentGatewayModeBadge({ mode, gateway }: PaymentGatewayModeBadgeProps) {
  const label = LABELS[mode][gateway];

  return (
    <span className={`payment-gateway-mode-badge is-${mode}`} title={label}>
      {mode === 'test' ? 'Sandbox' : 'Live'}
    </span>
  );
}
