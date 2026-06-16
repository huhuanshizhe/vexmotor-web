'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { fetchAddresses } from '@/lib/account-api';

import { AddressesClient } from './addresses-client';
import type { AccountAddress } from '@/lib/account-api';

function toClientAddress(address: AccountAddress) {
  return {
    ...address,
    company: address.company ?? null,
    phone: address.phone ?? null,
    state: address.state ?? null,
    addressLine2: address.addressLine2 ?? null,
  };
}

export default function AccountAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Awaited<ReturnType<typeof fetchAddresses>>>([]);

  useEffect(() => {
    if (!user) return;
    void fetchAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [user]);

  return <AddressesClient initialAddresses={addresses.map(toClientAddress)} />;
}
