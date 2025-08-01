import { z } from "zod";

export const gameStartSchema = z.object({
  player1: z.string().min(1, "Player 1 name is required"),
  player2: z.string().min(1, "Player 2 name is required"),
});

export const gameStatusSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
});

export const moveSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  move: z.string().min(1, "Move action is required"),
});
