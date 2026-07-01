import { apiFetch } from '@/lib/api-client';

export type IndustryOption = {
  value: string;
  label: string;
};

let cachedIndustries: IndustryOption[] | null = null;
let industriesPromise: Promise<IndustryOption[]> | null = null;

export async function fetchIndustries(): Promise<IndustryOption[]> {
  if (cachedIndustries) {
    return cachedIndustries;
  }

  if (!industriesPromise) {
    industriesPromise = apiFetch<{ items: IndustryOption[] }>('/api/front/meta/industries?locale=en')
      .then((response) => {
        cachedIndustries = response.items;
        return response.items;
      })
      .catch((error) => {
        industriesPromise = null;
        throw error;
      });
  }

  return industriesPromise;
}

export function getIndustryLabel(items: IndustryOption[], value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '—';
  }

  const match = items.find((item) => item.value === trimmed);
  return match?.label ?? trimmed;
}

export function resolveIndustrySlug(items: IndustryOption[], value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (items.some((item) => item.value === trimmed)) {
    return trimmed;
  }

  const byLabel = items.find((item) => item.label === trimmed);
  return byLabel?.value ?? trimmed;
}
