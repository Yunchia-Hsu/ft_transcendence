import { request, withJson } from "./request";
import type { Game } from "./types";

export const GamesApi = {
  start(body: { player1: string; player2: string }) {
    return request<Game>(
      "/api/games/start",
      withJson(body, { method: "POST" })
    );
  },

  get(gameId: string) {
    return request<Game>(`/api/games/${gameId}`, { method: "GET" });
  },

  list(params?: { status?: "In Progress" | "Completed"; player?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.player) qs.set("player", params.player);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<Game[]>(`/api/games${suffix}`, { method: "GET" });
  },

  move(
    gameId: string,
    body: { playerId: string; move: "UP" | "DOWN" | "STAY" }
  ) {
    return request<{ ok: true; accepted: true; game: Game }>(
      `/api/games/${gameId}/move`,
      withJson(body, { method: "POST" })
    );
  },

  // ⬇️ Updated: swallow 409 (already completed) and 404 (not found) as controlled results
  async complete(
    gameId: string,
    body?: { score?: string; winnerId?: string }
  ): Promise<
    | { ok: true; game: Game }
    | { ok: false; code: "ALREADY_COMPLETED" | "GAME_NOT_FOUND" }
  > {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";
    const res = await fetch(`${base}/api/games/${gameId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 409) return { ok: false, code: "ALREADY_COMPLETED" };
    if (res.status === 404) return { ok: false, code: "GAME_NOT_FOUND" };

    if (!res.ok) {
      // For any other unexpected status, still throw (so devs notice)
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed (${res.status})`);
    }

    const json = (await res.json()) as { ok: true; game: Game };
    return json;
  },
};
