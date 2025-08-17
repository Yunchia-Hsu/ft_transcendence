import type { Kysely } from "kysely";
import type { DatabaseSchema, Game } from "infra/db/index.js";
import { randomUUID } from "crypto";

// ✅ db is now passed as the first argument
export const startGame = async (
  db: Kysely<DatabaseSchema>,
  data: { player1: string; player2: string }
) => {
  const { player1, player2 } = data;
  const gameId = randomUUID();

  const newGame: Game = {
    game_id: gameId,
    player1,
    player2,
    score: "0-0",
    status: "In Progress",
  };

  await db.insertInto("games").values(newGame).execute();

  return newGame;
};

export const getGameStatus = async (
  db: Kysely<DatabaseSchema>,
  gameId: string
) => {
  const gameStatus = await db
    .selectFrom("games")
    .selectAll()
    .where("game_id", "=", gameId)
    .executeTakeFirst();

  return gameStatus ?? null;
};

export const makeMove = async (
  db: Kysely<DatabaseSchema>,
  gameId: string,
  data: { playerId: string; move: string }
) => {
  const { playerId, move } = data;

  // Example: update score or log move
  // For now just return a dummy response
  return { message: "Move processed", gameId, playerId, move };
};
