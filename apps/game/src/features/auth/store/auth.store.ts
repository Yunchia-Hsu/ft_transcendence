// apps/game/src/features/auth/store/auth.store.ts
import { create } from "zustand";
import { AuthApi, type LoginResponse } from "@/shared/api";

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
  tempToken: string | null;
  loading: boolean;
  error: string | null;
  twoFactorEnabled: boolean | null;
  userProfile: UserProfile | null;
  hydrated: boolean;
  // actions
  init: () => void; // now a no-op, but kept for compatibility
  logout: () => void;
  register: (input: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (input: {
    username: string;
    password: string;
  }) => Promise<"ok" | "2fa">;
  verify2fa: (code: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: {
    username: string;
    displayname: string | null;
    avatar?: string | null;
  }) => Promise<void>;
};

// ---- read localStorage synchronously so first render sees auth ----
function getInitialAuth() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return { token: null, userId: null, twoFactorEnabled: null };
    const { token, userId, twoFactorEnabled } = JSON.parse(raw) as {
      token: string | null;
      userId: string | null;
      twoFactorEnabled?: boolean | null;
    };
    return {
      token: token ?? null,
      userId: userId ?? null,
      twoFactorEnabled: twoFactorEnabled ?? null,
    };
  } catch {
    return { token: null, userId: null, twoFactorEnabled: null };
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialAuth();

  return {
    // state
    token: initial.token,
    userId: initial.userId,
    tempToken: null,
    loading: false,
    error: null,
    twoFactorEnabled: initial.twoFactorEnabled,
    userProfile: null,
    hydrated: true, // already hydrated synchronously

    // actions
    init() {
      // no-op now (kept so existing calls don’t break)
    },

    logout() {
      localStorage.removeItem("auth");
      set({ token: null, userId: null, tempToken: null, userProfile: null });
    },

    async register(input) {
      set({ loading: true, error: null });
      try {
        await AuthApi.register(input);
      } catch (e: any) {
        set({ error: e?.message || "Register failed" });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    async login(input) {
      set({ loading: true, error: null });
      try {
        const res: LoginResponse = await AuthApi.login(input);
        if ("requireTwoFactor" in res && res.requireTwoFactor) {
          set({ tempToken: res.tempToken || null });
          return "2fa";
        }
        const token = res.token;
        const userId = res.userId;

        const me = await AuthApi.me(token);
        const tfa = (me as any)?.twoFactorEnabled ?? null;

        localStorage.setItem(
          "auth",
          JSON.stringify({ token, userId, twoFactorEnabled: tfa })
        );
        set({ token, userId, twoFactorEnabled: tfa });
        return "ok";
      } catch (e: any) {
        set({ error: e?.message || "Login failed" });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    async verify2fa(code) {
      const tempToken = get().tempToken;
      if (!tempToken) throw new Error("Missing temp token");
      set({ loading: true, error: null });
      try {
        const res = await AuthApi.verify2fa({ tempToken, code });
        const token = res.token;
        const userId = res.userId;
        localStorage.setItem(
          "auth",
          JSON.stringify({ token, userId, twoFactorEnabled: true })
        );
        set({ token, userId, tempToken: null, twoFactorEnabled: true });
      } catch (e: any) {
        set({ error: e?.message || "2FA verification failed" });
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
        const profile = (await AuthApi.me(token)) as UserProfile;
        set({ userProfile: profile });
      } catch (e: any) {
        set({ error: e?.message || "Failed to fetch profile" });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    async updateUserProfile(data) {
      const { token, userId } = get();
      if (!token || !userId) throw new Error("Not authenticated");
      set({ loading: true, error: null });
      try {
        await AuthApi.updateProfile(token, userId, data);
        await get().fetchUserProfile();
      } catch (e: any) {
        set({ error: e?.message || "Failed to update profile" });
        throw e;
      } finally {
        set({ loading: false });
      }
    },
  };
});
