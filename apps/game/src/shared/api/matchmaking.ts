// apps/game/src/shared/api/matchmaking.ts
import { request, withJson } from "./request";

export const MatchmakingApi = {
  enqueue(userId: string) {
    return request<
      | { status: "queued"; userId: string; mode: "1v1" }
      | {
          status: "matched";
          userId: string;
          opponent: { userId: string };
          matchId: string;
        }
      | { ok: false; code: "ALREADY_IN_GAME" }
    >("/api/matchmaking/queue", withJson({ userId }, { method: "POST" }));
  },

  dequeue(userId: string) {
    return request<
      | { ok: true; removed: boolean; userId: string }
      | { ok: false; code: "NOT_FOUND"; userId: string }
    >("/api/matchmaking/queue", withJson({ userId }, { method: "DELETE" }));
  },

  status(userId: string) {
    return request<
      | { status: "idle" }
      | { status: "queued" }
      | { status: "matched"; matchId: string; opponent: { userId: string } }
    >(`/api/matchmaking/status/${encodeURIComponent(userId)}`, {
      method: "GET",
    });
  },
};
