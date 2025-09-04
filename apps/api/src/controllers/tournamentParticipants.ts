// src/http/controllers/tournamentParticipants.ts

import type { Kysely } from "kysely";
import type { DatabaseSchema } from "infra/db/index.js";

export async function joinTournament(
  db: Kysely<DatabaseSchema>,
  opts: { tournamentId: string; userId: string; nickname?: string }
): Promise<
  | { ok: true; joinedAt: string; nickname: string }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_STARTED" | "FULL" }
> {
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", opts.tournamentId)
    .executeTakeFirst();

  if (!t) return { ok: false, code: "NOT_FOUND" };
  if (t.status !== "pending") return { ok: false, code: "ALREADY_STARTED" };

  // capacity check
  const count = await db
    .selectFrom("tournament_participants")
    .select((eb) => eb.fn.countAll<number>().as("cnt"))
    .where("tournament_id", "=", opts.tournamentId)
    .executeTakeFirst();

  const current = Number(count?.cnt ?? 0);
  if (current >= t.size) return { ok: false, code: "FULL" };

  // derive nickname if not provided
  let nickname = opts.nickname;
  if (!nickname) {
    const user = await db
      .selectFrom("users")
      .select(["username", "displayname"])
      .where("userid", "=", opts.userId)
      .executeTakeFirst();
    nickname = (user?.displayname ?? user?.username ?? "player").slice(0, 50);
  }

  const joinedAt = new Date().toISOString();

  // Try insert; if exists (PK), treat as idempotent success
  try {
    await db
      .insertInto("tournament_participants")
      .values({
        tournament_id: opts.tournamentId,
        user_id: opts.userId,
        nickname: nickname!,
        joined_at: joinedAt,
      })
      .execute();
  } catch (e: any) {
    // SQLite constraint → already joined; we return ok to be idempotent
    // Optionally you could update nickname here if you want override-on-join:
    // await db.updateTable("tournament_participants")
    //   .set({ nickname: nickname! })
    //   .where("tournament_id","=",opts.tournamentId)
    //   .where("user_id","=",opts.userId)
    //   .execute();
    return { ok: true, joinedAt, nickname: nickname! };
  }

  return { ok: true, joinedAt, nickname: nickname! };
}
