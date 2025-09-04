import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createDb } from "infra/db/index.js";
import { verifyToken } from "../utils/auth.js";
import {
  tournamentIdParamSchema,
  errorSchema,
} from "../schemas/tournamentSchemas.js";
import { tournamentJoinBodySchema } from "../schemas/tournamentSchemas.js";
import { joinTournament } from "../controllers/tournamentParticipants.js";

const tournamentParticipantsRoutes = (app: OpenAPIHono) => {
  const db = createDb();

  // POST /api/tournaments/:tournamentId/participants — join (current user)
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/tournaments/{tournamentId}/participants",
      request: {
        params: tournamentIdParamSchema,
        headers: z.object({
          authorization: z.string().describe("Bearer <JWT>"),
        }),
        body: {
          required: false,
          content: { "application/json": { schema: tournamentJoinBodySchema } },
        },
      },
      responses: {
        200: {
          description: "Joined (idempotent)",
          content: {
            "application/json": {
              schema: z.object({
                ok: z.literal(true),
                joinedAt: z.string(),
                nickname: z.string(),
              }),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: { "application/json": { schema: errorSchema } },
        },
        404: {
          description: "Tournament not found",
          content: { "application/json": { schema: errorSchema } },
        },
        409: {
          description: "Tournament full or already started",
          content: { "application/json": { schema: errorSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Join tournament (current user)",
      operationId: "joinTournament",
    }),
    async (c) => {
      try {
        // auth
        const auth =
          c.req.header("authorization") ?? c.req.header("Authorization");
        if (!auth)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);

        const token = verifyToken(auth);
        if (!token.valid || !token.userId)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);

        // input
        const { tournamentId } = c.req.valid("param");
        const body = (await c.req.json().catch(() => ({}))) as unknown;
        const parsed = tournamentJoinBodySchema.safeParse(body);
        const nickname = parsed.success ? parsed.data.nickname : undefined;

        // do join
        const result = await joinTournament(db, {
          tournamentId,
          userId: token.userId,
          nickname,
        });

        if (!result.ok) {
          if (result.code === "NOT_FOUND")
            return c.json({ ok: false, code: "NOT_FOUND" }, 404);
          if (result.code === "ALREADY_STARTED")
            return c.json({ ok: false, code: "ALREADY_STARTED" }, 409);
          if (result.code === "FULL")
            return c.json({ ok: false, code: "FULL" }, 409);
        }

        // optional: broadcast over WS here
        // broadcastTournament(tournamentId, { type: "participant_joined", userId: token.userId });

        return c.json(result, 200);
      } catch (err) {
        return c.json(
          { ok: false, code: "SERVER_ERROR", message: (err as Error).message },
          500
        );
      }
    }
  );
};

export default tournamentParticipantsRoutes;
