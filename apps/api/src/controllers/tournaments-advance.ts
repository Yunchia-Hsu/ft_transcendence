// controllers/tournaments-advance.ts
import type { Kysely } from "kysely";
import type { DatabaseSchema, Game } from "../../../../packages/infra/db/index.js";
import { randomUUID } from "crypto";

/**
 * Invoked after a game is completed.
 * - Marks the tournament match as decided.
 * - If the round is fully decided, advances winners into the next round,
 *   creates the next round's games (if both players known), and updates
 *   tournament status (ongoing/completed).
 */
export async function maybeAdvanceTournamentFromGame(
  db: Kysely<DatabaseSchema>,
  game: Game
) {
  // Not a tournament game? nothing to do.
  const match = await db
    .selectFrom("tournament_matches")
    .selectAll()
    .where("game_id", "=", game.game_id)
    .executeTakeFirst();
  if (!match) return;

  // Persist winner on the match
  await db
    .updateTable("tournament_matches")
    .set({ winner_user_id: game.winner_id })
    .where("tournament_id", "=", match.tournament_id)
    .where("round", "=", match.round)
    .where("match_index", "=", match.match_index)
    .execute();

  // If not all matches in this round are decided, stop here.
  const roundRows = await db
    .selectFrom("tournament_matches")
    .select(["winner_user_id"])
    .where("tournament_id", "=", match.tournament_id)
    .where("round", "=", match.round)
    .execute();

  if (!roundRows.every((r) => !!r.winner_user_id)) return;

  // Get tournament meta
  // controllers/tournaments-advance.ts
  const t = await db
    .selectFrom("tournaments")
    .select(["size", "status"]) // ⬅️ use existing columns
    .where("id", "=", match.tournament_id)
    .executeTakeFirstOrThrow();

  const finalRound = Math.log2(t.size);

  // Final round decided → complete tournament
  if (match.round === finalRound) {
    await db
      .updateTable("tournaments")
      .set({ status: "completed" })
      .where("id", "=", match.tournament_id)
      .execute();
    return;
  }

  // Advance winners to next round
  const winners = await db
    .selectFrom("tournament_matches")
    .select(["winner_user_id", "match_index"])
    .where("tournament_id", "=", match.tournament_id)
    .where("round", "=", match.round)
    .orderBy("match_index", "asc")
    .execute();

  const nextRound = match.round + 1;

  for (let i = 0; i < winners.length; i += 2) {
    const w1 = winners[i]?.winner_user_id ?? null;
    const w2 = winners[i + 1]?.winner_user_id ?? null;
    const nextIndex = Math.floor(i / 2);

    // Upsert next-round match shell with the two winners
    await db
      .insertInto("tournament_matches")
      .values({
        tournament_id: match.tournament_id,
        round: nextRound,
        match_index: nextIndex,
        p1_user_id: w1,
        p2_user_id: w2,
        winner_user_id: null,
        game_id: null,
      })
      .onConflict((oc) =>
        oc.columns(["tournament_id", "round", "match_index"]).doUpdateSet({
          p1_user_id: (eb: any) => eb.ref("excluded.p1_user_id"),
          p2_user_id: (eb: any) => eb.ref("excluded.p2_user_id"),
        })
      )
      .execute();

    // When both players ready, create a game and attach it
    if (w1 && w2) {
      const gameId = randomUUID();
      await db
        .insertInto("games")
        .values({
          game_id: gameId,
          player1: w1,
          player2: w2,
          score: "0-0",
          status: "In Progress",
          winner_id: null,
        })
        .execute();

      await db
        .updateTable("tournament_matches")
        .set({ game_id: gameId })
        .where("tournament_id", "=", match.tournament_id)
        .where("round", "=", nextRound)
        .where("match_index", "=", nextIndex)
        .execute();
    }
  }

  // make sure tournament isn’t stuck in pending
  await db
    .updateTable("tournaments")
    .set({ status: "ongoing" })
    .where("id", "=", match.tournament_id)
    .execute();
}
