import { create } from 'zustand';
import { AuthApi, LoginResponse } from '../services/auth.api';

type UserProfile = {
  id: string;
  username: string;
  displayname: string | null;
  email: string;
  avatar: string | null;
  status: string;
  twoFactorEnabled: boolean;
};

type AuthState = {
  token: string | null;
  userId: string | null;
  tempToken: string | null; // for 2FA step
  loading: boolean;
  error: string | null;
  twoFactorEnabled: boolean | null;
  userProfile: UserProfile | null;
  init: () => void;
  logout: () => void;
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  login: (input: { username: string; password: string }) => Promise<'ok' | '2fa'>;
  verify2fa: (code: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: { username: string; displayname: string | null; avatar?: string | null }) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  userId: null,
  tempToken: null,
  loading: false,
  error: null,
  twoFactorEnabled: null,
  userProfile: null,

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
    set({ token: null, userId: null, tempToken: null, userProfile: null });
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

  async fetchUserProfile() {
    const { token } = get();
    if (!token) return;
    
    set({ loading: true, error: null });
    try {
      const profile = await AuthApi.me(token) as UserProfile;
      set({ userProfile: profile });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch profile' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  async updateUserProfile(data) {
    const { token, userId } = get();
    if (!token || !userId) throw new Error('Not authenticated');
    
    set({ loading: true, error: null });
    try {
      const updatedProfile = await AuthApi.updateProfile(token, userId, data);
      // Fetch the complete profile to get all fields
      await get().fetchUserProfile();
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update profile' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
}));


