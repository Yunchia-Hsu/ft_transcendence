import { Kysely, SqliteDialect } from "kysely";
import  Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
export type FriendStatus = 'pending' | 'accepted' | 'declined';
// ----- DB Paths -----
// Use import.meta.url to get the current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || __dirname;
const dbPath = path.join(dbDir, "games.sqlite");
// at top-level after computing dbPath
export const DB_PATH = dbPath;

// in initDB()
console.log("Using SQLite file:", DB_PATH);
console.log(
  "DB init ok: games, matchmaking_queue, tournaments, tournament_participants, tournament_matches, users"
);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("DB folder created:", dbDir);
} else {
  console.log("DB folder exists:", dbDir);
}

/* ---------- Types ---------- */
export interface Game {
  game_id: string; // PK
  player1: string;
  player2: string;
  score: string; // serialized game state or score
  status: string; // "pending" | "ongoing" | "completed"
}

export interface Tournament {
  id: string; // PK
  name: string;
  type: string; // "single_elim"
  size: number; // 4, 8, 16...
  status: string; // "pending" | "ongoing" | "completed"
  owner_id: string;
  created_at: string; // ISO
}

export interface TournamentParticipant {
  tournament_id: string; // PK part
  user_id: string; // PK part
  nickname: string;
  joined_at: string; // ISO
}

/** Link each bracket slot to an optional game and players */
export interface TournamentMatch {
  tournament_id: string; // PK part
  round: number; // PK part (1..)
  match_index: number; // PK part (0..N-1 within round)
  game_id: string | null;
  p1_user_id: string | null;
  p2_user_id: string | null;
  winner_user_id: string | null;
}

export interface MatchmakingQueue {
  user_id: string;
  queued_at: string; // ISO
}



export interface DatabaseSchema {
  games: Game;
  matchmaking_queue: MatchmakingQueue;
  tournaments: Tournament;
  tournament_participants: TournamentParticipant;
  tournament_matches: TournamentMatch;
  users: DatabaseUser;
  friends: Friends;
}


export interface DatabaseUser {    
  userid: string;
  username: string;
  displayname: string | null;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: string;
  avatar: string | null;
  status: string;
  twoFactorSecret: string | null;
  twoFactorEnabled: number; //0 false 1 true
}

export interface Friends{
  friendid: string;
  user1: string;
  user2: string;
  friendstatus: FriendStatus;
  requested_by: string;
}

// ----- Create DB function -----
// export const createDb = (): Kysely<DatabaseSchema> => {
//   const db = new Kysely<DatabaseSchema>({
//     dialect: new SqliteDialect({
//       database: new Database(dbPath),
//     }),
//   });
//   return db;
// };
export const createDb = (): Kysely<DatabaseSchema> => {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
};

export const db = createDb();

/* ---------- Schema init ---------- */
export const initDB = async (): Promise<void> => {
  await db.schema
    .createTable("games")
    .ifNotExists()
    .addColumn("game_id", "text", (col) => col.primaryKey())
    .addColumn("player1", "text")
    .addColumn("player2", "text")
    .addColumn("score", "text")
    .addColumn("status", "text")
    .execute();

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
    .addColumn("name", "text", (c) => c.notNull())
    .addColumn("type", "text", (c) => c.notNull())
    .addColumn("size", "integer", (c) => c.notNull())
    .addColumn("status", "text", (c) => c.notNull())
    .addColumn("created_at", "text", (c) => c.notNull())
    .addColumn("owner_id", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("tournament_participants")
    .ifNotExists()
    .addColumn("tournament_id", "text", (col) => col.notNull())
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("nickname", "text", (col) => col.notNull())
    .addColumn("joined_at", "text", (col) => col.notNull())
    .addPrimaryKeyConstraint("tournament_participants_pk", [
      "tournament_id",
      "user_id",
    ])
    .execute();

  await db.schema
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

  await db.schema
    .createTable("users")
    .ifNotExists()
    .addColumn("userid", "text", (col) => col.primaryKey())
    .addColumn("username", "text", (col) => col.notNull().unique())
    .addColumn("displayname", "text")
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password", "text", (col) => col.notNull())
    .addColumn("isEmailVerified", "integer", (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn("createdAt", "text", (col) => col.notNull())
    .addColumn("avatar", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("offline"))
    .addColumn("twoFactorSecret", "text")
    .addColumn("twoFactorEnabled", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  // Helpful indexes
  await db.schema
    .createIndex("idx_tournaments_owner")
    .ifNotExists()
    .on("tournaments")
    .columns(["owner_id"])
    .execute();

  await db.schema
    .createIndex("idx_tp_tournament")
    .ifNotExists()
    .on("tournament_participants")
    .columns(["tournament_id"])
    .execute();

  await db.schema
    .createIndex("idx_tm_tournament_round")
    .ifNotExists()
    .on("tournament_matches")
    .columns(["tournament_id", "round"])
    .execute();

  console.log(
    "DB init ok: games, matchmaking_queue, tournaments, tournament_participants, tournament_matches, users"
  );
  
  await db.schema
    .createTable("friends")
    .ifNotExists()
    .addColumn("friendid", "text", (col) => col.primaryKey())
    .addColumn("user1", "text", (col) => col.notNull())
    .addColumn("user2", "text", (col) => col.notNull())
    .addColumn("friendstatus", "text",(col) => col.notNull().defaultTo("pending"))
    .addColumn("requested_by", "text") 
    .execute();
    console.log("DB init: ensured tables games, matchmaking_queue, users");
};

/* ---------- User helpers (no any/unknown) ---------- */

export const checkUserExists = async (
  username: string,
  email: string
): Promise<boolean> => {
  const existingUser = await db
    .selectFrom("users")
    .select("userid")
    .where((eb) =>
      eb.or([eb("username", "=", username), eb("email", "=", email)])
    )
    .executeTakeFirst();

  return existingUser !== undefined;
};

export const saveUserToDatabase = async (user: DatabaseUser): Promise<void> => {
  await db
    .insertInto("users")
    .values({
      userid: user.userid,
      username: user.username,
      displayname: user.displayname,
      email: user.email,
      password: user.password,
      isEmailVerified: user.isEmailVerified ? (1 as any) : (0 as any), // SQLite 使用 integer 儲存 boolean
      createdAt: user.createdAt,
      avatar: user.avatar,
      status: user.status,
    })
    .execute();
};

export const getUserByUsername = async (username: string): Promise<DatabaseUser | null> => {
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();

  if (!user) return null;

  return {
    userid: user.userid,
    username: user.username,
    displayname: user.displayname,
    email: user.email,
    password: user.password,
    isEmailVerified: user.isEmailVerified, // Already a boolean
    createdAt: user.createdAt,
    avatar: user.avatar,
    status: user.status,
    twoFactorSecret: user.twoFactorSecret,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};

export const getUserById = async (userid: string): Promise<DatabaseUser | null> => {
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("userid", "=", userid)
    .executeTakeFirst();

  if (!user) return null;

  return {
    userid: user.userid,
    username: user.username,
    displayname: user.displayname,
    email: user.email,
    password: user.password,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    avatar: user.avatar,
    status: user.status,
    twoFactorSecret: user.twoFactorSecret,
    twoFactorEnabled: user.twoFactorEnabled,
  };
  return row ? normalizeUser(row) : null;
};

export const getUserByEmail = async (
  email: string
): Promise<DatabaseUser | null> => {
  const row = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user) return null;

  return {
    userid: user.userid,
    username: user.username,
    displayname: user.displayname,
    email: user.email,
    password: user.password,            
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    avatar: user.avatar,
    status: user.status,
    twoFactorSecret: user.twoFactorSecret,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};
