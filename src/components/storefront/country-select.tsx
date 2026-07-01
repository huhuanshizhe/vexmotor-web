'use client';

import { useCountries } from '@/hooks/use-countries';

type CountrySelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
};

export function CountrySelect({
  value,
  onChange,
  className,
  disabled = false,
  required = false,
  placeholder = 'Select country',
  id,
  name,
}: CountrySelectProps) {
  const { items, loading, error } = useCountries();

  return (
    <select
      id={id}
      name={name}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || loading}
      required={required}
    >
      <option value="">
        {loading ? 'Loading countries...' : error ? 'Unable to load countries' : placeholder}
      </option>
      {items.map((item) => (
        <option key={item.isoAlpha2} value={item.isoAlpha2}>
          {item.nameEn}
        </option>
      ))}
    </select>
  );
}
