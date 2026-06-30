type PaymentMethodIconProps = {
  method: string;
  className?: string;
};

export function PaymentMethodIcon({ method, className }: PaymentMethodIconProps) {
  const iconClass = className ? `payment-method-icon-svg ${className}` : 'payment-method-icon-svg';

  if (method === 'PayPal') {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7.5 19.5h2.2c2.8 0 4.9-1.8 5.4-4.6l1.1-6.8c.3-1.8-1.2-3.4-3-3.4H8.8L7.5 19.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M5.2 19.5H3.4c-.9 0-1.6-.7-1.4-1.6l2.2-13.2c.2-1.1 1.1-1.9 2.2-1.9h6.1c3.5 0 6.2 2.5 6.8 5.9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (method === 'Wire transfer') {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V8l7-4 7 4v13" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
        <path d="M12 10v8" />
      </svg>
    );
  }

  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10.5h19" />
      <path d="M6.5 15.5h4" />
    </svg>
  );
}
