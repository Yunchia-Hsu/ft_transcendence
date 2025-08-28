import { z } from "@hono/zod-openapi";
import { TournamentTypeEnum, TournamentStatusEnum } from "@pong/types";

// Body for POST /api/tournaments
export const tournamentCreateSchema = z.object({
  name: z.string().min(1).openapi({ example: "Weekend Cup" }),
  type: z
    .nativeEnum(TournamentTypeEnum)
    .openapi({ example: TournamentTypeEnum.SINGLE_ELIM }),
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
