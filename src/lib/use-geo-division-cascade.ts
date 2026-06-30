'use client';

import { useEffect, useState } from 'react';

import { fetchGeoCountries, fetchGeoDivisions, type GeoCountry, type GeoDivision } from '@/lib/geo-api';

export function useGeoDivisionCascade(countryCode: string) {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [admin1Options, setAdmin1Options] = useState<GeoDivision[]>([]);
  const [admin2Options, setAdmin2Options] = useState<GeoDivision[]>([]);
  const [selectedAdmin1Id, setSelectedAdmin1Id] = useState<string | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingAdmin1, setIsLoadingAdmin1] = useState(false);
  const [isLoadingAdmin2, setIsLoadingAdmin2] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCountries(true);
    void fetchGeoCountries()
      .then((items) => {
        if (!cancelled) setCountries(items);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCountries(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setAdmin1Options([]);
      setAdmin2Options([]);
      setSelectedAdmin1Id(null);
      return;
    }

    let cancelled = false;
    setIsLoadingAdmin1(true);
    setAdmin2Options([]);
    setSelectedAdmin1Id(null);
    void fetchGeoDivisions(countryCode)
      .then((items) => {
        if (!cancelled) setAdmin1Options(items);
      })
      .catch(() => {
        if (!cancelled) setAdmin1Options([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAdmin1(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    if (!countryCode || !selectedAdmin1Id) {
      setAdmin2Options([]);
      return;
    }

    let cancelled = false;
    setIsLoadingAdmin2(true);
    void fetchGeoDivisions(countryCode, selectedAdmin1Id)
      .then((items) => {
        if (!cancelled) setAdmin2Options(items);
      })
      .catch(() => {
        if (!cancelled) setAdmin2Options([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAdmin2(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, selectedAdmin1Id]);

  function syncAdmin1FromStateName(stateName: string) {
    const match = admin1Options.find((item) => item.nameEn === stateName || item.code === stateName);
    if (match) {
      setSelectedAdmin1Id(match.id);
    }
  }

  return {
    countries,
    admin1Options,
    admin2Options,
    selectedAdmin1Id,
    setSelectedAdmin1Id,
    syncAdmin1FromStateName,
    isLoadingCountries,
    isLoadingAdmin1,
    isLoadingAdmin2,
  };
}
