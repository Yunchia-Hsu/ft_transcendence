import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.resolve("packages/infra/db");
const dbPath = path.join(dbDir, "games.sqlite");

console.log("DB folder:", dbDir);
console.log("DB file path:", dbPath);

if (!fs.existsSync(dbDir)) {
  console.log("DB folder not found, creating it...");
  fs.mkdirSync(dbDir, { recursive: true });
} else {
  console.log("DB folder exists!");
}

// Interfaces
export interface Game {
  game_id: string;
  player1: string;
  player2: string;
  score: string;
  status: string;
}

export interface DatabaseSchema {
  games: Game;
}

// SQLite file

// Kysely DB instance
export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database(dbPath), // ✅ synchronous, fully typed
  }),
});

// Initialize table if not exists
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
};
