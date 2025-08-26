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
  users: DatabaseUser; // yunchia added 
}

export interface DatabaseUser {    //yunchia added 25.08
  userid: string;
  username: string;
  displayname: string | null;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: string;
  avatar: string | null;
  status: string;
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

  // non block 
  sqlite.pragma('journal_mode = WAL');   // (Write-Ahead Logging) one write in multi read 
  sqlite.pragma('busy_timeout = 5000');  // wait 5sec and go to SQLITE_BUSY

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
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
  // user data
  await db.schema
    .createTable("users")
    .ifNotExists()
    .addColumn("userid", "text", (col) => col.primaryKey())
    .addColumn("username", "text", (col) => col.notNull().unique())
    .addColumn("displayname", "text")
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password", "text", (col) => col.notNull())
    .addColumn("isEmailVerified", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdAt", "text", (col) => col.notNull())
    .addColumn("avatar", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("offline"))
    .execute();
  
    console.log("DB init: ensured tables games, matchmaking_queue, users");
};


// check if users exists
export const checkUserExists = async (username: string, email: string): Promise<boolean> => {
  const existingUser = await db
    .selectFrom("users")
    .select("userid")
    .where((eb) => eb.or([
      eb("username", "=", username),
      eb("email", "=", email)
    ]))
    .executeTakeFirst();

  return existingUser !== undefined;
};

// save users to database
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

// 根據用戶名取得用戶
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
  };
};

// 根據 userid 取得用戶
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
  };
};

export const getUserByEmail = async (email: string): Promise<DatabaseUser | null> => {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
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
  };
};
