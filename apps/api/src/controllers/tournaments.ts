import { randomUUID } from "crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../../../../packages/infra/db/index.js";
import {
  TournamentTypeEnum,
  TournamentStatusEnum,
  type TournamentDTO,
} from "../types/local-tournament.js";

export const createTournament = async (
  db: Kysely<DatabaseSchema>,
  data: { name: string; type: TournamentTypeEnum; size: number },
  ownerId: string
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
      owner_id: ownerId,
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

export interface TournamentsListItem {
  id: string;
  name: string;
  status: TournamentStatusEnum | keyof typeof TournamentStatusEnum | string;
}

export interface TournamentsListResponse {
  items: TournamentsListItem[];
  total: number;
}

export const listTournaments = async (
  db: Kysely<DatabaseSchema>
): Promise<TournamentsListResponse> => {
  const rows = await db
    .selectFrom("tournaments")
    .select(["id", "name", "status"])
    .orderBy("created_at", "desc")
    .execute();

  return { items: rows, total: rows.length };
};

const roundsFor = (size: number): number => Math.log2(size);

export interface TournamentDetail {
  id: string;
  name: string;
  status: TournamentStatusEnum | keyof typeof TournamentStatusEnum | string;
  size: number;
  rounds: number;
  participants: Array<{ userId: string; nickname: string }>;
}

export const getTournamentDetail = async (
  db: Kysely<DatabaseSchema>,
  tournamentId: string
): Promise<TournamentDetail | null> => {
  const t = await db
    .selectFrom("tournaments")
    .selectAll()
    .where("id", "=", tournamentId)
    .executeTakeFirst();

  if (!t) return null;

  const participants =
    (await db
      .selectFrom("tournament_participants")
      .select((eb) => [
        eb.ref("user_id").as("userId"),
        eb.ref("nickname").as("nickname"),
      ])
      .where("tournament_id", "=", tournamentId)
      .orderBy("joined_at", "asc")
      .execute()) ?? [];

  return {
    id: t.id,
    name: t.name,
    status: t.status,
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

  await db
    .deleteFrom("tournament_participants")
    .where("tournament_id", "=", tournamentId)
    .execute();

  await db.deleteFrom("tournaments").where("id", "=", tournamentId).execute();

  return "DELETED";
};
