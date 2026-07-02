'use client';

import { useEffect, useMemo } from 'react';

import { SearchableSelect } from '@/components/ui/searchable-select';
import type { AccountAddress } from '@/lib/account-api';
import { formatGeoCountryOption, formatGeoDivisionOption } from '@/lib/geo-display';
import { useTranslation } from '@/lib/i18n-context';
import { useGeoDivisionCascade } from '@/lib/use-geo-division-cascade';

export type AddressFormState = {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  countryCode: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  isDefault: boolean;
};

export function createEmptyAddressForm(defaultCountryCode = 'US'): AddressFormState {
  return {
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    countryCode: defaultCountryCode,
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    isDefault: false,
  };
}

export function addressToForm(address: AccountAddress): AddressFormState {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? '',
    phone: address.phone ?? '',
    countryCode: address.countryCode,
    state: address.state ?? '',
    city: address.city,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? '',
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

type AddressFormFieldsProps = {
  form: AddressFormState;
  onChange: (next: AddressFormState) => void;
  variant?: 'page' | 'checkout';
  disabled?: boolean;
};

export function AddressFormFields({ form, onChange, variant = 'page', disabled = false }: AddressFormFieldsProps) {
  const { t } = useTranslation();
  const {
    countries,
    admin1Options,
    admin2Options,
    selectedAdmin1Id,
    setSelectedAdmin1Id,
    syncAdmin1FromStateName,
    isLoadingCountries,
    isLoadingAdmin1,
  } = useGeoDivisionCascade(form.countryCode);

  const compactClass = variant === 'checkout' ? 'checkout-address-form-grid' : 'inquiry-form-grid checkout-reference-grid';

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.isoAlpha2,
        label: formatGeoCountryOption(country),
      })),
    [countries],
  );

  const admin1SelectOptions = useMemo(
    () =>
      admin1Options.map((option) => ({
        value: option.id,
        label: formatGeoDivisionOption(option),
      })),
    [admin1Options],
  );

  useEffect(() => {
    if (form.state && !selectedAdmin1Id && admin1Options.length) {
      syncAdmin1FromStateName(form.state);
    }
  }, [admin1Options, form.state, selectedAdmin1Id, syncAdmin1FromStateName]);

  function update<K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className={compactClass}>
      <label className="form-field">
        <span>{t('addressForm.firstName')}</span>
        <input className="form-input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} disabled={disabled} />
      </label>
      <label className="form-field">
        <span>{t('addressForm.lastName')}</span>
        <input className="form-input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} disabled={disabled} />
      </label>
      <label className="form-field">
        <span>{t('addressForm.company')}</span>
        <input className="form-input" value={form.company} onChange={(e) => update('company', e.target.value)} disabled={disabled} placeholder={t('checkout.optional')} />
      </label>
      <label className="form-field">
        <span>{t('addressForm.phone')}</span>
        <input className="form-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} disabled={disabled} placeholder={t('checkout.optional')} />
      </label>
      <label className="form-field">
        <span>{t('addressForm.countryRegion')}</span>
        <SearchableSelect
          value={form.countryCode}
          onChange={(countryCode) => onChange({ ...form, countryCode, state: '', city: '' })}
          options={countryOptions.length ? countryOptions : [{ value: form.countryCode, label: form.countryCode }]}
          placeholder={t('addressForm.searchCountry')}
          disabled={disabled || isLoadingCountries}
        />
      </label>
      <label className="form-field">
        <span>{t('addressForm.stateProvince')}</span>
        {admin1Options.length ? (
          <SearchableSelect
            value={selectedAdmin1Id ?? ''}
            onChange={(nextId) => {
              const option = admin1Options.find((item) => item.id === nextId);
              setSelectedAdmin1Id(nextId || null);
              onChange({ ...form, state: option?.nameEn ?? '', city: '' });
            }}
            options={admin1SelectOptions}
            placeholder={t('addressForm.searchState')}
            disabled={disabled || isLoadingAdmin1}
          />
        ) : (
          <input
            className="form-input"
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
            onBlur={() => syncAdmin1FromStateName(form.state)}
            disabled={disabled}
            placeholder={t('addressForm.statePlaceholder')}
          />
        )}
      </label>
      <label className="form-field">
        <span>{t('addressForm.city')}</span>
        {admin2Options.length ? (
          <select
            className="form-input"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            disabled={disabled}
          >
            <option value="">{t('addressForm.selectCity')}</option>
            {admin2Options.map((option) => (
              <option key={option.id} value={option.nameEn}>{formatGeoDivisionOption(option)}</option>
            ))}
          </select>
        ) : (
          <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} disabled={disabled} />
        )}
      </label>
      <label className="form-field">
        <span>{t('addressForm.postalCode')}</span>
        <input className="form-input" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} disabled={disabled} />
      </label>
      <label className={`form-field ${variant === 'page' ? 'checkout-field-span' : ''}`}>
        <span>{t('addressForm.addressLine1')}</span>
        <input className="form-input" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} disabled={disabled} />
      </label>
      <label className={`form-field ${variant === 'page' ? 'checkout-field-span' : ''}`}>
        <span>{t('addressForm.addressLine2')}</span>
        <input className="form-input" value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} disabled={disabled} placeholder={t('checkout.optional')} />
      </label>
      <label className="address-default-row checkout-field-span">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} disabled={disabled} />
        <span>{t('addressForm.setDefault')}</span>
      </label>
    </div>
  );
}

export function isAddressFormComplete(form: AddressFormState) {
  return Boolean(
    form.firstName.trim() &&
      form.lastName.trim() &&
      form.countryCode.trim() &&
      form.city.trim() &&
      form.addressLine1.trim() &&
      form.postalCode.trim(),
  );
}

export function toAddressPayload(form: AddressFormState) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    company: form.company.trim() || null,
    phone: form.phone.trim() || null,
    countryCode: form.countryCode.trim().toUpperCase(),
    state: form.state.trim() || null,
    city: form.city.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    postalCode: form.postalCode.trim(),
    isDefault: form.isDefault,
  };
}
