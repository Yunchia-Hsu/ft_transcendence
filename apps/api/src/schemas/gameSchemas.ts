import { z } from "@hono/zod-openapi";

export const gameStartSchema = z.object({
  player1: z.string().min(1).openapi({ example: "alice123" }),
  player2: z.string().min(1).openapi({ example: "bob456" }),
});

export const gameParamSchema = z.object({
  gameId: z
    .string()
    .uuid()
    .openapi({ example: "1909a6a3-f219-4f25-a486-e123602f984f" }),
});

export const moveParamSchema = gameParamSchema; // same shape

export const moveSchema = z.object({
  playerId: z.string().min(1).openapi({ example: "alice123" }),
  move: z.enum(["UP", "DOWN", "STAY"]).openapi({ example: "UP" }),
});

export const gameSchema = z.object({
  game_id: z.string().uuid(),
  player1: z.string(),
  player2: z.string(),
  score: z.string(),
  status: z.string(),
});

export const makeMoveSuccessSchema = z.object({
  ok: z.literal(true),
  accepted: z.literal(true),
  game: gameSchema,
});

export const listGamesQuerySchema = z.object({
  status: z
    .enum(["In Progress", "Completed"])
    .optional()
    .openapi({ example: "In Progress" }),
  player: z.string().optional().openapi({ example: "alice123" }),
});
