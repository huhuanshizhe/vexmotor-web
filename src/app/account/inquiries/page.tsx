'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { fetchInquiries } from '@/lib/account-api';

export default function AccountInquiriesPage() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Array<{ id: string; inquiryNumber: string; status: string }>>([]);

  useEffect(() => {
    if (!user) return;
    void fetchInquiries()
      .then((data) => setInquiries((data as { items?: typeof inquiries }).items ?? (Array.isArray(data) ? data : [])))
      .catch(() => setInquiries([]));
  }, [user]);

  return (
    <div className="account-panel-stack">
      <h1 className="section-title">Inquiries</h1>
      {!inquiries.length ? <p className="section-description">No inquiries submitted yet.</p> : null}
      <div className="info-grid">
        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="info-card">
            <h2 style={{ marginTop: 0 }}>{inquiry.inquiryNumber}</h2>
            <p className="section-description">{inquiry.status}</p>
            <Link href={`/inquiries/${inquiry.id}`} className="section-link">View inquiry</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
