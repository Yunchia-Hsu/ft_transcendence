// apps/server/src/api/schemas/gameSchemas.ts
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

export const moveParamSchema = gameParamSchema;

export const moveSchema = z.object({
  playerId: z.string().min(1).openapi({ example: "alice123" }),
  move: z.enum(["UP", "DOWN", "STAY"]).openapi({ example: "UP" }),
});

export const gameSchema = z.object({
  game_id: z.string().uuid(),
  player1: z.string(),
  player2: z.string(),
  score: z.string(),
  status: z.string(), // "In Progress" | "Completed" | "Terminated"
  winner_id: z.string().nullable(),
});

export const makeMoveSuccessSchema = z.object({
  ok: z.literal(true),
  accepted: z.literal(true),
  game: gameSchema,
});

// ⬇️ include "Terminated" in filters
export const listGamesQuerySchema = z.object({
  status: z
    .enum(["In Progress", "Completed", "Terminated"])
    .optional()
    .openapi({ example: "In Progress" }),
  player: z.string().optional().openapi({ example: "alice123" }),
});

export const completeGameBodySchema = z
  .object({
    score: z.string().optional().openapi({ example: "11-7" }),
    winnerId: z.string().optional().openapi({ example: "alice123" }),
  })
  .openapi({ example: { score: "11-7", winnerId: "alice123" } });

export const completeGameOkSchema = z.object({
  ok: z.literal(true),
  game: z.object({
    game_id: z.string().uuid(),
    player1: z.string(),
    player2: z.string(),
    score: z.string(),
    status: z.literal("Completed"),
    winner_id: z.string().nullable(),
  }),
});

export const completeGameErrSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["GAME_NOT_FOUND", "ALREADY_COMPLETED"]),
});

// ⬇️ NEW: terminate
export const terminateGameBodySchema = z
  .object({
    score: z.string().optional().openapi({ example: "3-4" }),
  })
  .openapi({ example: { score: "3-4" } });

export const terminateGameOkSchema = z.object({
  ok: z.literal(true),
  game: z.object({
    game_id: z.string().uuid(),
    player1: z.string(),
    player2: z.string(),
    score: z.string(),
    status: z.literal("Terminated"),
    winner_id: z.null(),
  }),
});

export const terminateGameErrSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["GAME_NOT_FOUND", "ALREADY_COMPLETED", "ALREADY_TERMINATED"]),
});
