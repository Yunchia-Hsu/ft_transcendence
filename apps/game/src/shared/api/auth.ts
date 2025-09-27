// apps/game/src/shared/api/auth.ts
import { request, withJson } from "./request";
import type { LoginResponse, Verify2FAResponse } from "./types";

export const AuthApi = {
  register(input: { username: string; email: string; password: string }) {
    return request<{
      userId: string;
      username: string;
      email: string;
      createdAt: string;
    }>("/api/auth/users/register", withJson(input, { method: "POST" }));
  },

  login(input: { username: string; password: string }) {
    return request<LoginResponse>(
      "/api/auth/users/login",
      withJson(input, { method: "POST" })
    );
  },

  verify2fa(input: { tempToken: string; code: string }) {
    return request<Verify2FAResponse>(
      "/api/auth/verify-2fa",
      withJson(input, { method: "POST" })
    );
  },

  me(token: string) {
    return request<
      | { id: string; username: string; twoFactorEnabled?: boolean }
      | { error: string }
    >("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  setup2fa(token: string) {
    return request<{ qrCode: string; manualEntryKey: string }>(
      "/api/auth/setup-2fa",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  activate2fa(token: string, code: string) {
    return request<{ success: boolean }>("/api/auth/activate-2fa", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
  },

  updateProfile(
    token: string,
    userId: string,
    data: {
      username: string;
      displayname: string | null;
      avatar?: string | null;
    }
  ) {
    return request<{
      userId: string;
      username: string;
      displayname: string | null;
      avatar?: string | null;
    }>(`/api/auth/users/${userId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};
