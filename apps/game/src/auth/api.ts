export type LoginResponse =
  | { token: string; userId: string; requireTwoFactor?: false; tempToken?: undefined }
  | { requireTwoFactor: true; tempToken: string; token?: undefined; userId?: undefined };

export type Verify2FAResponse = { token: string; userId: string };

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {}
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const AuthApi = {
  register(input: { username: string; email: string; password: string }) {
    return request<{ userId: string; username: string; email: string; createdAt: string }>(
      '/api/auth/users/register',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },

  login(input: { username: string; password: string }) {
    return request<LoginResponse>('/api/auth/users/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verify2fa(input: { tempToken: string; code: string }) {
    return request<Verify2FAResponse>('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  me(token: string) {
    return request<{ id: string; username: string; twoFactorEnabled?: boolean } | { error: string }>(
      '/api/auth/me',
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    );
  },

  setup2fa(token: string) {
    return request<{ qrCode: string; manualEntryKey: string }>('/api/auth/setup-2fa', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  activate2fa(token: string, code: string) {
    return request<{ success: boolean }>('/api/auth/activate-2fa', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
  },
};


