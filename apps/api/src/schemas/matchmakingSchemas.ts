import { z } from "@hono/zod-openapi";

export const enqueueBodySchema = z.object({
  userId: z.string().min(1),
  mode: z.enum(["1v1"]).optional().default("1v1"),
});

export const enqueueResponseQueuedSchema = z.object({
  status: z.literal("queued"),
  userId: z.string(),
  mode: z.enum(["1v1"]),
});

export const enqueueResponseMatchedSchema = z.object({
  status: z.literal("matched"),
  userId: z.string(),
  opponent: z.object({ userId: z.string() }),
  matchId: z.string(),
});

export const enqueueResponseConflictSchema = z.object({
  ok: z.literal(false),
  code: z.literal("ALREADY_IN_GAME"),
});

export const enqueueErrorSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["INVALID_BODY", "SERVER_ERROR"]),
  message: z.string().optional(),
  issues: z.any().optional(),
});

export const dequeueBodySchemaRt = z.object({
  userId: z.string().min(1),
});
