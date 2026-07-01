'use client';

import { useIndustries } from '@/hooks/use-industries';

type IndustrySelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
};

export function IndustrySelect({
  value,
  onChange,
  className,
  disabled = false,
  required = false,
  placeholder = 'Select industry',
  id,
  name,
}: IndustrySelectProps) {
  const { items, loading, error } = useIndustries();

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
        {loading ? 'Loading industries...' : error ? 'Unable to load industries' : placeholder}
      </option>
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
