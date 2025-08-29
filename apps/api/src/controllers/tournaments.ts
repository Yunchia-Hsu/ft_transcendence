import { randomUUID } from "crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "infra/db/index.js";
import {
  TournamentTypeEnum,
  TournamentStatusEnum,
  type TournamentDTO,
} from "@pong/types";

export const createTournament = async (
  db: Kysely<DatabaseSchema>,
  data: { name: string; type: TournamentTypeEnum; size: number },
  ownerId: string // <- pass separately
): Promise<TournamentDTO> => {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .insertInto("tournaments")
    .values({
      id,
      name: data.name,
      type: data.type,
      size: data.size,
      status: TournamentStatusEnum.PENDING,
      owner_id: ownerId, // <- use param
      created_at: createdAt,
    })
    .execute();

  return {
    id,
    name: data.name,
    type: data.type,
    size: data.size,
    status: TournamentStatusEnum.PENDING,
    createdAt,
  };
};

export const listTournaments = async (db: Kysely<DatabaseSchema>) => {
  const rows = await db
    .selectFrom("tournaments")
    .select(["id", "name", "status"])
    .orderBy("created_at", "desc")
    .execute();

  return { items: rows, total: rows.length };
};

const roundsFor = (size: number) => Math.log2(size);

export const getTournamentDetail = async (
  db: Kysely<DatabaseSchema>,
  tournamentId: string
) => {
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", tournamentId)
    .executeTakeFirst();

  if (!t) return null;

  const participants =
    (await db
      .selectFrom("tournament_participants")
      .select(["user_id as userId", "nickname"])
      .where("tournament_id", "=", tournamentId)
      .orderBy("joined_at", "asc")
      .execute()) ?? [];

  return {
    id: t.id,
    name: t.name,
    status: t.status as keyof typeof TournamentStatusEnum,
    size: t.size,
    rounds: roundsFor(t.size),
    participants,
  };
};

export const deleteTournament = async (
  db: Kysely<DatabaseSchema>,
  tournamentId: string
): Promise<"NOT_FOUND" | "DELETED"> => {
  const existing = await db
    .selectFrom("tournaments")
    .select("id")
    .where("id", "=", tournamentId)
    .executeTakeFirst();

  if (!existing) return "NOT_FOUND";

  // delete participants first (FK safety if you add constraints later)
  await db
    .deleteFrom("tournament_participants")
    .where("tournament_id", "=", tournamentId)
    .execute();

  await db.deleteFrom("tournaments").where("id", "=", tournamentId).execute();

  return "DELETED";
};
