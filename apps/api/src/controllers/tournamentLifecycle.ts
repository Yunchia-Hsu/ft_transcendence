// controllers/tournamentLifecycle.ts
import { randomUUID } from "crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../../../../packages/infra/db/index.js";

/* ---------- Types ---------- */
export type StartOk = {
  ok: true;
  status: "ongoing";
  rounds: number;
  matchesCreated: number;
};
export type StartErr =
  | { ok: false; code: "NOT_FOUND" }
  | { ok: false; code: "FORBIDDEN" }
  | { ok: false; code: "ALREADY_STARTED" }
  | { ok: false; code: "INSUFFICIENT_PARTICIPANTS" }
  | { ok: false; code: "SIZE_NOT_POWER_OF_TWO" };

export type RecordResultOk = {
  ok: true;
  advancedToNext?: boolean;
  completed?: boolean;
};
export type RecordResultErr =
  | { ok: false; code: "NOT_FOUND" }
  | { ok: false; code: "NOT_ONGOING" }
  | { ok: false; code: "MATCH_NOT_FOUND" }
  | { ok: false; code: "INVALID_WINNER" }
  | { ok: false; code: "ALREADY_REPORTED" };

export interface BracketPlayer {
  userId: string | null;
  nickname: string | null;
}
export interface BracketMatch {
  round: number;
  matchIndex: number;
  gameId: string | null;
  p1: BracketPlayer;
  p2: BracketPlayer;
  winnerUserId: string | null;
}
export type BracketOk = { ok: true; rounds: number; matches: BracketMatch[] };
export type BracketErr = { ok: false; code: "NOT_FOUND" };

/* ---------- Helpers ---------- */
const isPowerOfTwo = (n: number): boolean => n >= 2 && (n & (n - 1)) === 0;

// Ensure the matches table exists on THIS connection/transaction (idempotent).
async function ensureTournamentMatchesTable(
  trx: Kysely<DatabaseSchema>
): Promise<void> {
  await trx.schema
    .createTable("tournament_matches")
    .ifNotExists()
    .addColumn("tournament_id", "text", (c) => c.notNull())
    .addColumn("round", "integer", (c) => c.notNull())
    .addColumn("match_index", "integer", (c) => c.notNull())
    .addColumn("game_id", "text")
    .addColumn("p1_user_id", "text")
    .addColumn("p2_user_id", "text")
    .addColumn("winner_user_id", "text")
    .addPrimaryKeyConstraint("tm_pk", ["tournament_id", "round", "match_index"])
    .execute();
}

/** Minimal row shape used for seeding R1 */
interface SeedRow {
  user_id: string;
  nickname: string;
}

/* ---------- Start ---------- */
export async function startTournament(
  db: Kysely<DatabaseSchema>,
  opts: { tournamentId: string; startedByUserId: string }
): Promise<StartOk | StartErr> {
  return db.transaction().execute(async (trx) => {
    const t = await trx
      .selectFrom("tournaments")
      .selectAll()
      .where("id", "=", opts.tournamentId)
      .executeTakeFirst();

    if (!t) return { ok: false, code: "NOT_FOUND" } as const;
    if (t.owner_id !== opts.startedByUserId)
      return { ok: false, code: "FORBIDDEN" } as const;
    if (t.status !== "pending")
      return { ok: false, code: "ALREADY_STARTED" } as const;
    if (!isPowerOfTwo(t.size))
      return { ok: false, code: "SIZE_NOT_POWER_OF_TWO" } as const;

    const participants: SeedRow[] = await trx
      .selectFrom("tournament_participants")
      .select(["user_id", "nickname"])
      .where("tournament_id", "=", opts.tournamentId)
      .orderBy("joined_at", "asc")
      .execute();

    if (participants.length !== t.size) {
      return { ok: false, code: "INSUFFICIENT_PARTICIPANTS" } as const;
    }

    // Ensure table exists on this connection
    await ensureTournamentMatchesTable(trx);

    // Seed round 1 — PRE-CREATE a game for each pairing
    let created = 0;
    for (let i = 0; i < participants.length; i += 2) {
      const a = participants[i]!;
      const b = participants[i + 1]!;
      const gameId = randomUUID();

      // Create pending game
      await trx
        .insertInto("games")
        .values({
          game_id: gameId,
          player1: a.user_id,
          player2: b.user_id,
          score: "0-0",
          status: "pending",
        })
        .execute();

      // Link match to the pre-created game
      await trx
        .insertInto("tournament_matches")
        .values({
          tournament_id: opts.tournamentId,
          round: 1,
          match_index: i / 2,
          game_id: gameId,
          p1_user_id: a.user_id,
          p2_user_id: b.user_id,
          winner_user_id: null,
        })
        .execute();

      created++;
    }

    await trx
      .updateTable("tournaments")
      .set({ status: "ongoing" })
      .where("id", "=", opts.tournamentId)
      .execute();

    return {
      ok: true,
      status: "ongoing",
      rounds: Math.log2(t.size),
      matchesCreated: created,
    } as const;
  });
}

/* ---------- Record result ---------- */
export async function recordMatchResult(
  db: Kysely<DatabaseSchema>,
  opts: {
    tournamentId: string;
    round: number;
    matchIndex: number;
    winnerUserId: string;
  }
): Promise<RecordResultOk | RecordResultErr> {
  return db.transaction().execute(async (trx) => {
    // Ensure table exists on this connection
    await ensureTournamentMatchesTable(trx);

    const t = await trx
      .selectFrom("tournaments")
      .selectAll()
      .where("id", "=", opts.tournamentId)
      .executeTakeFirst();

    if (!t) return { ok: false, code: "NOT_FOUND" } as const;
    if (t.status !== "ongoing")
      return { ok: false, code: "NOT_ONGOING" } as const;

    const m = await trx
      .selectFrom("tournament_matches")
      .selectAll()
      .where("tournament_id", "=", opts.tournamentId)
      .where("round", "=", opts.round)
      .where("match_index", "=", opts.matchIndex)
      .executeTakeFirst();

    if (!m) return { ok: false, code: "MATCH_NOT_FOUND" } as const;
    if (m.winner_user_id)
      return { ok: false, code: "ALREADY_REPORTED" } as const;

    const isValidWinner =
      opts.winnerUserId === m.p1_user_id || opts.winnerUserId === m.p2_user_id;
    if (!isValidWinner) return { ok: false, code: "INVALID_WINNER" } as const;

    // Set winner for current match
    await trx
      .updateTable("tournament_matches")
      .set({ winner_user_id: opts.winnerUserId })
      .where("tournament_id", "=", opts.tournamentId)
      .where("round", "=", opts.round)
      .where("match_index", "=", opts.matchIndex)
      .execute();

    const maxRounds = Math.log2(t.size);
    if (opts.round === maxRounds) {
      // Final decided -> tournament complete
      await trx
        .updateTable("tournaments")
        .set({ status: "completed" })
        .where("id", "=", opts.tournamentId)
        .execute();
      return { ok: true, completed: true } as const;
    }

    // Propagate winner to the next round
    const nextRound = opts.round + 1;
    const nextIndex = Math.floor(opts.matchIndex / 2);
    const isLeftSeed = opts.matchIndex % 2 === 0;

    const next = await trx
      .selectFrom("tournament_matches")
      .selectAll()
      .where("tournament_id", "=", opts.tournamentId)
      .where("round", "=", nextRound)
      .where("match_index", "=", nextIndex)
      .executeTakeFirst();

    if (!next) {
      // Create next match with the winner placed on the correct side
      // If both sides end up present after this update, also pre-create a game.
      const p1 = isLeftSeed ? opts.winnerUserId : null;
      const p2 = isLeftSeed ? null : opts.winnerUserId;

      let gameId: string | null = null;
      if (p1 && p2) {
        // both known — create game now
        gameId = randomUUID();
        await trx
          .insertInto("games")
          .values({
            game_id: gameId,
            player1: p1,
            player2: p2,
            score: "0-0",
            status: "pending",
          })
          .execute();
      }

      await trx
        .insertInto("tournament_matches")
        .values({
          tournament_id: opts.tournamentId,
          round: nextRound,
          match_index: nextIndex,
          game_id: gameId,
          p1_user_id: p1,
          p2_user_id: p2,
          winner_user_id: null,
        })
        .execute();
    } else {
      // Update the existing next-round match with the winner on the correct side
      const newP1 = isLeftSeed ? opts.winnerUserId : next.p1_user_id;
      const newP2 = isLeftSeed ? next.p2_user_id : opts.winnerUserId;

      // If both sides are now known and there's no game yet, create one and link it
      let gameId: string | null = next.game_id;
      if (!gameId && newP1 && newP2) {
        gameId = randomUUID();
        await trx
          .insertInto("games")
          .values({
            game_id: gameId,
            player1: newP1,
            player2: newP2,
            score: "0-0",
            status: "pending",
          })
          .execute();
      }

      await trx
        .updateTable("tournament_matches")
        .set(
          isLeftSeed
            ? { p1_user_id: newP1, game_id: gameId }
            : { p2_user_id: newP2, game_id: gameId }
        )
        .where("tournament_id", "=", opts.tournamentId)
        .where("round", "=", nextRound)
        .where("match_index", "=", nextIndex)
        .execute();
    }

    return { ok: true, advancedToNext: true } as const;
  });
}

/* ---------- Bracket ---------- */
export async function getBracket(
  db: Kysely<DatabaseSchema>,
  tournamentId: string
): Promise<BracketOk | BracketErr> {
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", tournamentId)
    .executeTakeFirst();

  if (!t) return { ok: false, code: "NOT_FOUND" } as const;

  // Ensure table exists on this connection
  await ensureTournamentMatchesTable(db);

  const rows = await db
    .selectFrom("tournament_matches")
    .selectAll()
    .where("tournament_id", "=", tournamentId)
    .orderBy("round", "asc")
    .orderBy("match_index", "asc")
    .execute();

  const participants = await db
    .selectFrom("tournament_participants")
    .select(["user_id", "nickname"])
    .where("tournament_id", "=", tournamentId)
    .execute();

  const nickById = new Map<string, string>();
  for (const p of participants) nickById.set(p.user_id, p.nickname);

  const matches: BracketMatch[] = rows.map((m) => ({
    round: m.round,
    matchIndex: m.match_index,
    gameId: m.game_id,
    p1: {
      userId: m.p1_user_id,
      nickname: m.p1_user_id ? (nickById.get(m.p1_user_id) ?? null) : null,
    },
    p2: {
      userId: m.p2_user_id,
      nickname: m.p2_user_id ? (nickById.get(m.p2_user_id) ?? null) : null,
    },
    winnerUserId: m.winner_user_id,
  }));

  return { ok: true, rounds: Math.log2(t.size), matches } as const;
}
