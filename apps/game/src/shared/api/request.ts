// apps/game/src/shared/api/request.ts
const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

function toObjectHeaders(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return (h as Record<string, string>) ?? {};
}

export async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...toObjectHeaders(init.headers),
  };
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error?.message) {
        try {
          const validation = JSON.parse(data.error.message);
          if (Array.isArray(validation) && validation[0]?.message)
            message = validation[0].message;
          else message = data.error.message;
        } catch {
          message = data.error.message;
        }
      } else if (typeof data?.message === "string") message = data.message;
      else if (typeof data?.error === "string") message = data.error;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        /* ignore */
      }
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : ({} as T)) as T;
}

export function withJson(body: unknown, init: RequestInit = {}): RequestInit {
  return { ...init, body: JSON.stringify(body) };
}
