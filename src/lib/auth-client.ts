import { apiFetch, apiUploadForm, clearAccessToken, setAccessToken } from '@/lib/api-client';

export type RegistrationDocumentInput = {
  url: string;
  key: string;
  filename: string;
  contentType: string;
};

export type RegistrationUploadResponse = RegistrationDocumentInput & {
  size: number;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  jobTitle: string | null;
  status: 'active' | 'disabled' | 'pending';
  role?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  status: 'active' | 'disabled' | 'pending';
};

export type AuthTokenResponse = {
  token: string;
  user: AuthUserSummary;
  redirectPath?: string;
  message?: string;
};

export type AuthSession = {
  user: AuthUserSummary;
  redirectPath?: string;
  message?: string;
};

export type VerificationDocument = RegistrationDocumentInput & {
  uploadedAt?: string;
};

export type CompanyProfile = {
  company: string | null;
  industry: string | null;
  companyCountryCode: string | null;
  companyState: string | null;
  companyCity: string | null;
  companyAddressLine1: string | null;
  companyAddressLine2: string | null;
  companyPostalCode: string | null;
  website: string | null;
  taxId: string | null;
  companySize: string | null;
  annualVolumeEstimate: string | null;
  verificationDocuments: VerificationDocument[];
};

export type RegisterBusinessFormInput = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  companyName: string;
  country: string;
  industry: string;
  companySize: string;
  website: string;
  taxId: string;
  annualVolumeEstimate: string;
  documents: RegistrationDocumentInput[];
  termsAccepted: boolean;
  privacyAccepted: boolean;
  exportComplianceAccepted: boolean;
};

export type AuthRegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  jobTitle?: string | null;
  companyName?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  taxId?: string;
  annualVolumeEstimate?: string | null;
  documents?: RegistrationDocumentInput[];
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  exportComplianceAccepted?: boolean;
  _quick?: boolean;
};

function handleAuthResponse(response: AuthTokenResponse): AuthSession {
  if (response.token) {
    setAccessToken(response.token);
  }

  return {
    user: response.user,
    redirectPath: response.redirectPath,
    message: response.message,
  };
}

export function buildRegisterPayload(form: RegisterBusinessFormInput): AuthRegisterRequest {
  return {
    email: form.email.trim().toLowerCase(),
    password: form.password,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    jobTitle: form.role.trim() || null,
    companyName: form.companyName.trim(),
    country: form.country,
    industry: form.industry,
    companySize: form.companySize,
    website: form.website.trim(),
    taxId: form.taxId.trim(),
    annualVolumeEstimate: form.annualVolumeEstimate.trim() || null,
    documents: form.documents,
    termsAccepted: form.termsAccepted,
    privacyAccepted: form.privacyAccepted,
    exportComplianceAccepted: form.exportComplianceAccepted,
  };
}

export async function uploadRegistrationDocument(file: File): Promise<RegistrationDocumentInput> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiUploadForm<RegistrationUploadResponse>('/api/front/upload/registration', formData);

  return {
    url: response.url,
    key: response.key,
    filename: response.filename,
    contentType: response.contentType,
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await apiFetch<AuthTokenResponse>('/api/front/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return handleAuthResponse(response);
}

export async function register(payload: AuthRegisterRequest): Promise<AuthSession> {
  const response = await apiFetch<AuthTokenResponse>('/api/front/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return handleAuthResponse(response);
}

export function logout(): void {
  clearAccessToken();
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    return await apiFetch<UserProfile>('/api/front/profile');
  } catch {
    return null;
  }
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    return await apiFetch<CompanyProfile>('/api/front/profile/company');
  } catch {
    return null;
  }
}
