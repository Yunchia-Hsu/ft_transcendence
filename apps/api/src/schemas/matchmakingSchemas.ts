import { z } from "zod";

export const enqueueBodySchema = z.object({
  userId: z.string().min(1),
});

export const enqueueResponseSchema = z.union([
  z.object({ matched: z.literal(false) }),
  z.object({
    matched: z.literal(true),
    game: z.object({
      game_id: z.string(),
      player1: z.string(),
      player2: z.string(),
      score: z.string(),
      status: z.string(),
    }),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["ALREADY_IN_GAME"]),
  }),
]);
