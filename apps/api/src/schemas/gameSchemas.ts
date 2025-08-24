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

// ✅ describe a Game row (for responses)
export const gameSchema = z.object({
  game_id: z.string(),
  player1: z.string(),
  player2: z.string(),
  score: z.string(),
  status: z.string(),
});

// ✅ optional filters for GET /api/games
export const listGamesQuerySchema = z.object({
  status: z.string().optional(), // e.g., "In Progress", "Finished"
  player: z.string().optional(), // matches either player1 or player2
});
