// apps/server/src/api/controllers/games.ts
import type { Kysely } from "kysely";
import type { DatabaseSchema, Game } from "infra/db/index.js";
import { randomUUID } from "crypto";

export const startGame = async (
  db: Kysely<DatabaseSchema>,
  data: { player1: string; player2: string }
) => {
  const { player1, player2 } = data;
  const matchId = randomUUID();

  const newGame: Game = {
    game_id: matchId,
    player1,
    player2,
    score: "0-0",
    status: "In Progress",
    winner_id: null,
  };

  const insertData = {
    game_id: newGame.game_id,
    player1: newGame.player1,
    player2: newGame.player2,
    score: newGame.score,
    status: newGame.status,
    ...(newGame.winner_id && { winner_id: newGame.winner_id }),
  };

  await db.insertInto("games").values(insertData).execute();
  return newGame;
};

export const getGameStatus = async (
  db: Kysely<DatabaseSchema>,
  matchId: string
) => {
  const gameStatus = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", matchId)
    .executeTakeFirst();

  return gameStatus ?? null;
};

type MakeMoveInput = { playerId: string; move: "UP" | "DOWN" | "STAY" };
export const makeMove = async (
  db: Kysely<DatabaseSchema>,
  gameId: string,
  { playerId, move }: MakeMoveInput
): Promise<
  | { ok: true; accepted: true; game: Game }
  | {
      ok: false;
      code: "GAME_NOT_FOUND" | "PLAYER_NOT_IN_GAME" | "INVALID_MOVE";
    }
> => {
  const game = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();

  if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
  if (playerId !== game.player1 && playerId !== game.player2) {
    return { ok: false, code: "PLAYER_NOT_IN_GAME" };
  }
  if (!["UP", "DOWN", "STAY"].includes(move)) {
    return { ok: false, code: "INVALID_MOVE" };
  }
  return { ok: true, accepted: true, game };
};

export const listGames = async (
  db: Kysely<DatabaseSchema>,
  filters?: { status?: string; player?: string }
): Promise<Game[]> => {
  let q = db.selectFrom("games").selectAll();
  if (filters?.status) q = q.where("status", "=", filters.status);
  if (filters?.player) {
    q = q.where((eb) =>
      eb.or([
        eb("player1", "=", filters.player!),
        eb("player2", "=", filters.player!),
      ])
    );
  }
  return await q.execute();
};

export const completeGame = async (
  db: Kysely<DatabaseSchema>,
  gameId: string,
  body: { score?: string; winnerId?: string }
): Promise<
  | { ok: true; game: Game }
  | { ok: false; code: "GAME_NOT_FOUND" | "ALREADY_COMPLETED" }
> => {
  const game = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();

  if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
  if (game.status === "Completed")
    return { ok: false, code: "ALREADY_COMPLETED" };

  const newScore = body.score ?? game.score;

  let resolvedWinner: string | null = null;
  const provided = body.winnerId;
  if (provided && (provided === game.player1 || provided === game.player2)) {
    resolvedWinner = provided;
  } else {
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(newScore || "");
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (!Number.isNaN(a) && !Number.isNaN(b) && a !== b) {
        resolvedWinner = a > b ? game.player1 : game.player2;
      }
    }
  }

  await db
    .updateTable("games")
    .set({ status: "Completed", score: newScore, winner_id: resolvedWinner })
    .where("game_id", "=", gameId)
    .execute();

  const updated = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();
  return { ok: true, game: updated as Game };
};

// ⬇️ NEW: terminateGame
export const terminateGame = async (
  db: Kysely<DatabaseSchema>,
  gameId: string,
  body: { score?: string }
): Promise<
  | { ok: true; game: Game }
  | {
      ok: false;
      code: "GAME_NOT_FOUND" | "ALREADY_COMPLETED" | "ALREADY_TERMINATED";
    }
> => {
  const game = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();

  if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
  if (game.status === "Completed")
    return { ok: false, code: "ALREADY_COMPLETED" };
  if (game.status === "Terminated")
    return { ok: false, code: "ALREADY_TERMINATED" };

  const newScore = body.score ?? game.score;

  await db
    .updateTable("games")
    .set({ status: "Terminated", score: newScore, winner_id: null })
    .where("game_id", "=", gameId)
    .execute();

  const updated = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();
  return { ok: true, game: updated as Game };
};
