import { apiFetch, clearAccessToken, setAccessToken } from '@/lib/api-client';

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone?: string | null;
  status: 'active' | 'disabled' | 'pending';
};

type AuthResponse = UserProfile & {
  accessToken?: string;
  token?: string;
};

type RegisterPayload = Record<string, unknown>;

function extractToken(payload: AuthResponse): string | null {
  return payload.accessToken ?? payload.token ?? null;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const payload = await apiFetch<AuthResponse>('/api/front/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = extractToken(payload);
  if (token) {
    setAccessToken(token);
  }

  return payload;
}

export async function register(payload: RegisterPayload): Promise<UserProfile> {
  const response = await apiFetch<AuthResponse & { redirectPath?: string }>('/api/front/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const token = extractToken(response);
  if (token) {
    setAccessToken(token);
  }

  return response;
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
