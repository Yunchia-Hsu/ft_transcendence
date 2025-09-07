// controllers/tournamentParticipants.ts
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "infra/db/index.js";

/* ---------- Result types ---------- */
type JoinOk = { ok: true; joinedAt: string; nickname: string };
type JoinErr =
  | { ok: false; code: "NOT_FOUND" }
  | { ok: false; code: "ALREADY_STARTED" }
  | { ok: false; code: "FULL" };

type LeaveOk = { ok: true; left: true } | { ok: true; alreadyLeft: true };
type LeaveErr =
  | { ok: false; code: "NOT_FOUND" }
  | { ok: false; code: "ALREADY_STARTED" }
  | { ok: false; code: "OWNER_CANNOT_LEAVE" };

/** JOIN */
export async function joinTournament(
  db: Kysely<DatabaseSchema>,
  opts: { tournamentId: string; userId: string; nickname?: string }
): Promise<JoinOk | JoinErr> {
  // tournament exists & is pending?
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", opts.tournamentId)
    .executeTakeFirst();

  if (!t) return { ok: false, code: "NOT_FOUND" };
  if (t.status !== "pending") return { ok: false, code: "ALREADY_STARTED" };

  // capacity check (typed)
  const countRow = await db
    .selectFrom("tournament_participants")
    .select((eb) => eb.fn.countAll<number>().as("cnt"))
    .where("tournament_id", "=", opts.tournamentId)
    .executeTakeFirst();

  const current = countRow?.cnt ?? 0;
  if (current >= t.size) return { ok: false, code: "FULL" };

  // nickname (optional override → derive from user if absent)
  const user = await db
    .selectFrom("users")
    .select(["username", "displayname"])
    .where("userid", "=", opts.userId)
    .executeTakeFirst();

  const nickname: string = (
    opts.nickname ??
    user?.displayname ??
    user?.username ??
    "player"
  ).slice(0, 50);

  const joinedAt = new Date().toISOString();

  // Insert; if PK conflict, treat as idempotent success.
  try {
    await db
      .insertInto("tournament_participants")
      .values({
        tournament_id: opts.tournamentId,
        user_id: opts.userId,
        nickname,
        joined_at: joinedAt,
      })
      .execute();
  } catch {
    // Already joined → idempotent success
    return { ok: true, joinedAt, nickname };
  }

  return { ok: true, joinedAt, nickname };
}

/** LEAVE */
export async function leaveTournament(
  db: Kysely<DatabaseSchema>,
  opts: { tournamentId: string; userId: string }
): Promise<LeaveOk | LeaveErr> {
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", opts.tournamentId)
    .executeTakeFirst();

  if (!t) return { ok: false, code: "NOT_FOUND" };
  if (t.status !== "pending") return { ok: false, code: "ALREADY_STARTED" };
  if (t.owner_id === opts.userId)
    return { ok: false, code: "OWNER_CANNOT_LEAVE" };

  const existing = await db
    .selectFrom("tournament_participants")
    .select(["user_id"])
    .where("tournament_id", "=", opts.tournamentId)
    .where("user_id", "=", opts.userId)
    .executeTakeFirst();

  if (!existing) return { ok: true, alreadyLeft: true };

  await db
    .deleteFrom("tournament_participants")
    .where("tournament_id", "=", opts.tournamentId)
    .where("user_id", "=", opts.userId)
    .execute();

  return { ok: true, left: true };
}
