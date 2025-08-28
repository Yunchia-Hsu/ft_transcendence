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
  data: { name: string; type: TournamentTypeEnum; size: number }
): Promise<TournamentDTO> => {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .insertInto("tournaments")
    .values({
      id,
      name: data.name,
      type: data.type, // "single_elim"
      size: data.size,
      status: TournamentStatusEnum.PENDING, // "pending"
      created_at: createdAt,
    })
    .execute();

  return {
    id,
    name: data.name,
    type: TournamentTypeEnum.SINGLE_ELIM,
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
