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

export interface MatchmakingQueue {
  user_id: string;
  queued_at: string; // timestamp
}

export interface DatabaseSchema {
  games: Game;
  matchmaking_queue: MatchmakingQueue;
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

  console.log("DB init: ensured tables games, matchmaking_queue");
};
