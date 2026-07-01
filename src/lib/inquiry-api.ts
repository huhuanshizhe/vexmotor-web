import { apiFetch, apiUploadForm } from '@/lib/api-client';

export type InquiryAttachment = {
  url: string;
  key: string;
  filename: string;
  contentType: string;
};

export type InquiryRfqPayload = {
  project: {
    projectName: string;
    industry: string;
    targetStartDate: string;
    annualVolumeEstimate: string;
  };
  contact: {
    fullName: string;
    email: string;
    company: string;
    country: string;
    phone: string;
    vat: string;
    createAccount: boolean;
  };
  compliance: {
    unrestrictedUseConfirmed: boolean;
    complianceAccepted: boolean;
  };
  lines: Array<{
    productId: string | null;
    spu: string;
    name: string;
    slug: string;
    quantity: number;
    requiredBy: string;
    notes: string;
    coverImage?: { url: string; alt: string } | null;
    lineAttachments?: InquiryAttachment[];
  }>;
  projectAttachments: InquiryAttachment[];
};

export type InquiryQuotedLine = {
  productId: string;
  spu: string;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  leadTime: string;
  note: string;
};

export type InquiryMessage = {
  id: string;
  senderType: 'customer' | 'admin';
  body: string;
  createdAt: string;
  adminName: string | null;
};

export type AccountInquiryListItem = {
  id: string;
  quoteNumber: string | null;
  status: string;
  projectName: string;
  lineCount: number;
  valueLabel: string;
  expiresAt: string | null;
  createdAt: string;
  quotedLines?: InquiryQuotedLine[] | null;
};

export type AccountInquiryDetail = AccountInquiryListItem & {
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  message: string;
  rfqPayload: InquiryRfqPayload | null;
  quotedLines: InquiryQuotedLine[] | null;
  messages: InquiryMessage[];
  productName: string;
  productSlug: string;
  productSpu: string;
};

export async function fetchInquiries() {
  return apiFetch<AccountInquiryListItem[]>('/api/front/inquiries');
}

export async function fetchInquiryDetail(idOrQuoteNumber: string) {
  return apiFetch<AccountInquiryDetail>(`/api/front/inquiries/${encodeURIComponent(idOrQuoteNumber)}`);
}

export async function postInquiryMessage(inquiryId: string, body: string) {
  return apiFetch<AccountInquiryDetail>(`/api/front/inquiries/${encodeURIComponent(inquiryId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function submitInquiry(payload: {
  productId: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  rfqPayload: InquiryRfqPayload;
}) {
  return apiFetch<{ id: string; quoteNumber: string; redirectPath: string }>('/api/front/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadInquiryDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUploadForm<InquiryAttachment & { size?: number }>('/api/front/upload/inquiry', formData);
}

export async function fetchQuoteCheckoutPreview(quoteNumber: string) {
  return apiFetch(`/api/front/checkout/quote-preview?quoteNumber=${encodeURIComponent(quoteNumber)}`);
}
