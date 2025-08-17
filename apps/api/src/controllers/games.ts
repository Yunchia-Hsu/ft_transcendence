import { db } from "infra/db/index.js";
import { randomUUID } from "crypto";

export const startGame = async (data: { player1: string; player2: string }) => {
  const { player1, player2 } = data;
  const gameId = randomUUID();

  const newGame = {
    game_id: gameId,
    player1,
    player2,
    score: "0-0",
    status: "In Progress",
  };

  await db.insertInto("games").values(newGame).execute();

  return newGame;
};

export const getGameStatus = async (gameId: string) => {
  const gameStatus = { gameId, score: "2-1", status: "In Progress" };
  return gameStatus;
};

export const makeMove = async (gameId: string, data: any) => {
  const { playerId, move } = data;
  return { message: "Move processed", gameId, playerId, move };
};
