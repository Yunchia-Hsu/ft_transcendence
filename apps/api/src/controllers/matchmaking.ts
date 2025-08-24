import type { Kysely } from "kysely";
import { randomUUID } from "crypto";
import type { DatabaseSchema, Game } from "infra/db/index.js";

/**
 * Enqueue user for quick play.
 * - If someone is waiting: pair immediately, create a game, return { matched:true, game }
 * - Otherwise: add to queue, return { matched:false }
 * - Idempotent: re-enqueue returns matched:false
 * - Guard: if already in active game -> return conflict-like payload
 */
export const enqueue = async (
  db: Kysely<DatabaseSchema>,
  userId: string
): Promise<
  | { matched: false }
  | { matched: true; game: Game }
  | { ok: false; reason: "ALREADY_IN_GAME" }
> => {
  // Single transaction to avoid race conditions
  return await db.transaction().execute(async (trx) => {
    // Guard: already in an active game? (treat anything not 'Completed' as active)
    const active = await trx
      .selectFrom("games")
      .select(["game_id", "status"])
      .where((eb) =>
        eb.or([eb("player1", "=", userId), eb("player2", "=", userId)])
      )
      .where("status", "!=", "Completed")
      .executeTakeFirst();

    if (active) {
      return { ok: false, reason: "ALREADY_IN_GAME" } as const;
    }

    // Idempotency: already in queue?
    const existing = await trx
      .selectFrom("matchmaking_queue")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    if (existing) {
      return { matched: false } as const;
    }

    // Look for earliest other waiting user
    const other = await trx
      .selectFrom("matchmaking_queue")
      .selectAll()
      .where("user_id", "!=", userId)
      .orderBy("queued_at", "asc")
      .executeTakeFirst();

    if (!other) {
      // nobody waiting -> enqueue this user
      await trx
        .insertInto("matchmaking_queue")
        .values({ user_id: userId, queued_at: new Date().toISOString() })
        .onConflict((oc) => oc.column("user_id").doNothing()) // extra safety
        .execute();
      return { matched: false } as const;
    }

    // Found opponent -> remove them from queue and create game
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
      status: "In Progress", // or "Waiting" until both WS join
    };

    await trx.insertInto("games").values(newGame).execute();

    return { matched: true, game: newGame } as const;
  });
};
