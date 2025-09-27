// apps/game/src/shared/api/games.ts
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
};
