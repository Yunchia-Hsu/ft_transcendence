import { z } from "@hono/zod-openapi";
import { tournamentIdParamSchema, errorSchema } from "./tournamentSchemas.js";

export { tournamentIdParamSchema, errorSchema };

export const startResponseSchema = z.object({
  ok: z.literal(true),
  status: z.literal("ongoing"),
  rounds: z.number().int(),
  matchesCreated: z.number().int(),
});

export const startErrorSchema = z.object({
  ok: z.literal(false),
  code: z.enum([
    "NOT_FOUND",
    "FORBIDDEN",
    "ALREADY_STARTED",
    "INSUFFICIENT_PARTICIPANTS",
    "SIZE_NOT_POWER_OF_TWO",
    "SERVER_ERROR",
  ]),
  message: z.string().optional(),
});

export const recordMatchBodySchema = z.object({
  round: z.number().int().min(1).openapi({ example: 1 }),
  matchIndex: z.number().int().min(0).openapi({ example: 0 }),
  winnerUserId: z.string().min(1).openapi({ example: "user-123" }),
});

export const recordMatchOkSchema = z.union([
  z.object({ ok: z.literal(true), advancedToNext: z.literal(true) }),
  z.object({ ok: z.literal(true), completed: z.literal(true) }),
]);

export const recordMatchErrSchema = z.object({
  ok: z.literal(false),
  code: z.enum([
    "NOT_FOUND",
    "NOT_ONGOING",
    "MATCH_NOT_FOUND",
    "INVALID_WINNER",
    "ALREADY_REPORTED",
    "SERVER_ERROR",
  ]),
  message: z.string().optional(),
});

export const bracketOkSchema = z.object({
  ok: z.literal(true),
  rounds: z.number().int(),
  matches: z.array(
    z.object({
      round: z.number().int(),
      matchIndex: z.number().int(),
      gameId: z.string().nullable(),
      p1: z.object({
        userId: z.string().nullable(),
        nickname: z.string().nullable(),
      }),
      p2: z.object({
        userId: z.string().nullable(),
        nickname: z.string().nullable(),
      }),
      winnerUserId: z.string().nullable(),
    })
  ),
});

export const bracketErrSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["NOT_FOUND", "SERVER_ERROR"]),
  message: z.string().optional(),
});
