// apps/game/src/shared/api/tournaments.ts
import { request } from "./request";
import type { TournamentListItem } from "./types";

export const TournamentsApi = {
  create(
    body: { name: string; type: "single_elim"; size: number },
    token?: string
  ) {
    return request<{
      id: string;
      name: string;
      type: "single_elim";
      size: number;
      status: "pending" | "ongoing" | "completed";
      createdAt: string;
    }>("/api/tournaments", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(body),
    });
  },

  list() {
    return request<{ items: TournamentListItem[]; total: number }>(
      "/api/tournaments",
      { method: "GET" }
    );
  },

  get(id: string) {
    return request(`/api/tournaments/${id}`, { method: "GET" });
  },

  remove(id: string) {
    return request(`/api/tournaments/${id}`, { method: "DELETE" });
  },

  join(id: string, token: string, nickname?: string) {
    return request<
      | { ok: true; joinedAt: string; nickname: string }
      | { ok: false; code: string }
    >(`/api/tournaments/${id}/participants`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: nickname ? JSON.stringify({ nickname }) : undefined,
    });
  },

  leave(id: string, token: string) {
    return request<
      | { ok: true; left: true }
      | { ok: true; alreadyLeft: true }
      | { ok: false; code: string }
    >(`/api/tournaments/${id}/participants`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  start(id: string, token: string) {
    return request<
      | { ok: true; status: "ongoing"; rounds: number; matchesCreated: number }
      | { ok: false; code: string }
    >(`/api/tournaments/${id}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  recordResult(
    id: string,
    token: string,
    body: { round: number; matchIndex: number; winnerUserId: string }
  ) {
    return request<
      | { ok: true; advancedToNext: true }
      | { ok: true; completed: true }
      | { ok: false; code: string }
    >(`/api/tournaments/${id}/matches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  },

  bracket(id: string) {
    return request<{
      ok: true;
      rounds: number;
      matches: Array<{
        round: number;
        matchIndex: number;
        gameId: string | null;
        p1: { userId: string | null; nickname: string | null };
        p2: { userId: string | null; nickname: string | null };
        winnerUserId: string | null;
      }>;
    }>(`/api/tournaments/${id}/bracket`, { method: "GET" });
  },
};
