import { create } from 'zustand';
import { AuthApi, LoginResponse } from './api';

type AuthState = {
  token: string | null;
  userId: string | null;
  tempToken: string | null; // for 2FA step
  loading: boolean;
  error: string | null;
  twoFactorEnabled: boolean | null;
  init: () => void;
  logout: () => void;
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  login: (input: { username: string; password: string }) => Promise<'ok' | '2fa'>;
  verify2fa: (code: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  userId: null,
  tempToken: null,
  loading: false,
  error: null,
  twoFactorEnabled: null,

  init() {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { token, userId, twoFactorEnabled } = JSON.parse(stored);
        set({ token, userId, twoFactorEnabled: twoFactorEnabled ?? null });
      } catch (e) {
        console.error('Failed to parse auth data from localStorage:', e);
      }
    }
  },

  logout() {
    localStorage.removeItem('auth');
    set({ token: null, userId: null, tempToken: null });
    // no redirect here; route components handle it
  },

  async register(input) {
    set({ loading: true, error: null });
    try {
      await AuthApi.register(input);
    } catch (e: any) {
      set({ error: e?.message || 'Register failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  async login(input) {
    set({ loading: true, error: null });
    try {
      const res: LoginResponse = await AuthApi.login(input);
      if ('requireTwoFactor' in res && res.requireTwoFactor) {
        set({ tempToken: res.tempToken || null });
        return '2fa';
      }
      const token = res.token;
      const userId = res.userId;
      // fetch profile to know 2FA state
      const me = await AuthApi.me(token);
      const tfa = (me as any)?.twoFactorEnabled ?? null;
      localStorage.setItem('auth', JSON.stringify({ token, userId, twoFactorEnabled: tfa }));
      set({ token, userId, twoFactorEnabled: tfa });
      return 'ok';
    } catch (e: any) {
      set({ error: e?.message || 'Login failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  async verify2fa(code) {
    const tempToken = get().tempToken;
    if (!tempToken) throw new Error('Missing temp token');
    set({ loading: true, error: null });
    try {
      const res = await AuthApi.verify2fa({ tempToken, code });
      const token = res.token;
      const userId = res.userId;
      localStorage.setItem('auth', JSON.stringify({ token, userId, twoFactorEnabled: true }));
      set({ token, userId, tempToken: null, twoFactorEnabled: true });
    } catch (e: any) {
      set({ error: e?.message || '2FA verification failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
}));


