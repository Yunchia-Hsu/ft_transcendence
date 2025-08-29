import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ----- DB Paths -----
// Use import.meta.url to get the current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || __dirname;
const dbPath = path.join(dbDir, "games.sqlite");
// const dbDir = path.join(__dirname);
// const dbPath = path.join(dbDir, "games.sqlite");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("DB folder created:", dbDir);
} else {
  console.log("DB folder exists:", dbDir);
}

// ----- Interfaces -----
export interface Game {
  game_id: string; // Primary key
  player1: string;
  player2: string;
  score: string;
  status: string;
}

export interface Tournament {
  id: string;
  name: string;
  type: string; // "single_elim"
  size: number; // 4, 8, 16...
  status: string; // "pending" | "ongoing" | "completed"
  owner_id: string;
  created_at: string; // ISO
}

export interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  nickname: string;
  joined_at: string; // ISO
}

export interface MatchmakingQueue {
  user_id: string;
  queued_at: string; // timestamp
}

export interface DatabaseSchema {
  games: Game;
  matchmaking_queue: MatchmakingQueue;
  tournaments: Tournament;
  tournament_participants: TournamentParticipant;
}

// ----- Create DB function -----
export const createDb = (): Kysely<DatabaseSchema> => {
  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new Database(dbPath),
    }),
  });
  return db;
};

// ----- Export a single DB instance -----
export const db = createDb();

// ----- Initialize table if not exists -----
export const initDB = async () => {
  await db.schema
    .createTable("games")
    .ifNotExists()
    .addColumn("game_id", "text", (col) => col.primaryKey())
    .addColumn("player1", "text")
    .addColumn("player2", "text")
    .addColumn("score", "text")
    .addColumn("status", "text")
    .execute();

  // matchmaking_queue (one row per waiting user)
  await db.schema
    .createTable("matchmaking_queue")
    .ifNotExists()
    .addColumn("user_id", "text", (col) => col.primaryKey())
    .addColumn("queued_at", "text")
    .execute();

  await db.schema
    .createTable("tournaments")
    .ifNotExists()
    .addColumn("id", "text", (c) => c.primaryKey())
    .addColumn("name", "text")
    .addColumn("type", "text")
    .addColumn("size", "integer")
    .addColumn("status", "text")
    .addColumn("created_at", "text")
    .addColumn("owner_id", "text")
    .execute();

  await db.schema
    .createTable("tournament_participants")
    .ifNotExists()
    .addColumn(
      "tournament_id",
      "text",
      (col) => col.notNull()
      // if we decide on FK and cascade:
      // .references("tournaments.id")
      // .onDelete("cascade")
    )
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("nickname", "text", (col) => col.notNull())
    .addColumn("joined_at", "text", (col) => col.notNull())
    .addPrimaryKeyConstraint("tournament_participants_pk", [
      "tournament_id",
      "user_id",
    ])
    .execute();

  console.log("DB init: ensured tables games, matchmaking_queue");
};
