// apps/game/src/shared/api/authedRequest.ts
import { request } from "./request";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function authedRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const baseHeaders =
    init.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : Array.isArray(init.headers)
        ? Object.fromEntries(init.headers)
        : ((init.headers as Record<string, string> | undefined) ?? {});

  const headers = token
    ? { ...baseHeaders, Authorization: `Bearer ${token}` }
    : baseHeaders;

  return request<T>(path, { ...init, headers });
}
