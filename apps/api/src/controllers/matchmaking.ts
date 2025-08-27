// controllers/matchmaking.ts
import type { Kysely } from "kysely";
import { randomUUID } from "crypto";
import type { DatabaseSchema, Game } from "infra/db/index.js";

export type EnqueueResult =
  | { type: "QUEUED"; userId: string; mode: "1v1" }
  | { type: "MATCHED"; userId: string; opponentUserId: string; matchId: string }
  | { type: "ALREADY_IN_QUEUE"; userId: string; mode: "1v1" }
  | { type: "ALREADY_IN_GAME" };

export const enqueue = async (
  db: Kysely<DatabaseSchema>,
  userId: string,
  mode: "1v1" = "1v1"
): Promise<EnqueueResult> => {
  return await db.transaction().execute(async (trx) => {
    // Guard: active game?
    const active = await trx
      .selectFrom("games")
      .select(["game_id", "status"])
      .where((eb) =>
        eb.or([eb("player1", "=", userId), eb("player2", "=", userId)])
      )
      .where("status", "!=", "Completed")
      .executeTakeFirst();

    if (active) {
      return { type: "ALREADY_IN_GAME" };
    }

    // Idempotent: already in queue?
    const existing = await trx
      .selectFrom("matchmaking_queue")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    if (existing) {
      return { type: "ALREADY_IN_QUEUE", userId, mode };
    }

    // Find earliest other waiting user
    const other = await trx
      .selectFrom("matchmaking_queue")
      .selectAll()
      .where("user_id", "!=", userId)
      .orderBy("queued_at", "asc")
      .executeTakeFirst();

    if (!other) {
      // enqueue current user
      await trx
        .insertInto("matchmaking_queue")
        .values({ user_id: userId, queued_at: new Date().toISOString() })
        .onConflict((oc) => oc.column("user_id").doNothing())
        .execute();

      return { type: "QUEUED", userId, mode };
    }

    // Found opponent -> remove them and create game
    await trx
      .deleteFrom("matchmaking_queue")
      .where("user_id", "=", other.user_id)
      .execute();

    const gameId = randomUUID();
    const newGame: Game = {
      game_id: gameId,
      player1: other.user_id,
      player2: userId,
      score: "0-0",
      status: "In Progress",
    };

    await trx.insertInto("games").values(newGame).execute();

    return {
      type: "MATCHED",
      userId,
      opponentUserId: other.user_id,
      matchId: gameId,
    };
  });
};

export const dequeue = async (
  db: Kysely<DatabaseSchema>,
  userId: string
): Promise<{ removed: boolean }> => {
  const res = await db
    .deleteFrom("matchmaking_queue")
    .where("user_id", "=", userId)
    .executeTakeFirst();

  const num =
    typeof res.numDeletedRows === "bigint"
      ? Number(res.numDeletedRows)
      : (res.numDeletedRows ?? 0);

  return { removed: num > 0 };
};

export type StatusResult =
  | { status: "idle" }
  | { status: "queued" }
  | { status: "matched"; matchId: string; opponent: { userId: string } };

export const getStatus = async (
  db: Kysely<DatabaseSchema>,
  userId: string
): Promise<StatusResult> => {
  // 1) active game? (anything not 'Completed')
  const active = await db
    .selectFrom("games")
    .select(["game_id", "player1", "player2", "status"])
    .where((eb) =>
      eb.or([eb("player1", "=", userId), eb("player2", "=", userId)])
    )
    .where("status", "!=", "Completed")
    .orderBy("game_id", "desc")
    .executeTakeFirst();

  if (active) {
    const opponentId =
      active.player1 === userId ? active.player2 : active.player1;
    return {
      status: "matched",
      matchId: active.game_id,
      opponent: { userId: opponentId },
    };
  }

  // 2) queued?
  const queued = await db
    .selectFrom("matchmaking_queue")
    .select(["user_id"])
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (queued) return { status: "queued" };

  // 3) idle
  return { status: "idle" };
};
