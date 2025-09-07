import { z } from "@hono/zod-openapi";
import { TournamentTypeEnum, TournamentStatusEnum } from "@pong/types";

const tournamentTypeCoerced = z.preprocess((v) => {
  if (typeof v === "string") return v.toLowerCase();
  return v;
}, z.nativeEnum(TournamentTypeEnum));

export const tournamentCreateSchema = z.object({
  name: z.string().min(1).openapi({ example: "Weekend Cup" }),
  type: tournamentTypeCoerced.openapi({ example: "single_elim" }),
  size: z.number().int().positive().openapi({ example: 8 }),
});

// Response DTO
export const tournamentItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.nativeEnum(TournamentTypeEnum),
  size: z.number().int(),
  status: z.nativeEnum(TournamentStatusEnum),
  createdAt: z.string(),
});

export const tournamentsListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.nativeEnum(TournamentStatusEnum),
});

export const tournamentsListResponseSchema = z.object({
  items: z.array(tournamentsListItemSchema),
  total: z.number().int(),
});

export const tournamentIdParamSchema = z.object({
  tournamentId: z
    .string()
    .uuid()
    .openapi({ example: "6f1b1a2f-2a7e-4f3a-bc8f-0b6f6a6f0e9a" }),
});

export const tournamentDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.nativeEnum(TournamentStatusEnum),
  size: z.number().int(),
  rounds: z.number().int(), // log2(size)
  participants: z.array(
    z.object({
      userId: z.string(),
      nickname: z.string(),
    })
  ),
});

export const errorSchema = z.object({
  ok: z.literal(false),
  code: z.string().openapi({ example: "NOT_FOUND" }),
  message: z.string().optional(),
});

// Body for POST /api/tournaments/:tournamentId/participants
// Optional nickname; if missing we derive from user.displayname || username
export const tournamentJoinBodySchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
});
