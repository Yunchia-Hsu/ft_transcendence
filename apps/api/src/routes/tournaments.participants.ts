// apps/api/src/routes/tournaments.participants.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../../../../packages/infra/db/index.js";
import { verifyToken } from "../utils/auth.js";
import {
  tournamentIdParamSchema,
  errorSchema,
  tournamentJoinBodySchema,
} from "../schemas/tournamentSchemas.js";
import {
  joinTournament,
  leaveTournament,
} from "../controllers/tournamentParticipants.js";

const tournamentParticipantsRoutes = (app: OpenAPIHono): void => {
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
        const auth =
          c.req.header("authorization") ?? c.req.header("Authorization");
        if (!auth)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);
        const token = verifyToken(auth);
        if (!token.valid || !token.userId)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);

        const { tournamentId } = c.req.valid("param");

        // optional body
        const raw = await c.req.json().catch(() => ({}));
        const parsed = tournamentJoinBodySchema.safeParse(raw);
        const nickname = parsed.success ? parsed.data.nickname : undefined;

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

        return c.json(result, 200);
      } catch (err) {
        return c.json(
          { ok: false, code: "SERVER_ERROR", message: (err as Error).message },
          500
        );
      }
    }
  );

  // DELETE /api/tournaments/:tournamentId/participants — leave (current user)
  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/tournaments/{tournamentId}/participants",
      request: {
        params: tournamentIdParamSchema,
        headers: z.object({
          authorization: z.string().describe("Bearer <JWT>"),
        }),
      },
      responses: {
        200: {
          description: "Left (idempotent)",
          content: {
            "application/json": {
              schema: z.union([
                z.object({ ok: z.literal(true), left: z.literal(true) }),
                z.object({ ok: z.literal(true), alreadyLeft: z.literal(true) }),
              ]),
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
          description: "Tournament already started or owner cannot leave",
          content: { "application/json": { schema: errorSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Leave tournament (current user)",
      operationId: "leaveTournament",
    }),
    async (c) => {
      try {
        const auth =
          c.req.header("authorization") ?? c.req.header("Authorization");
        if (!auth)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);
        const token = verifyToken(auth);
        if (!token.valid || !token.userId)
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);

        const { tournamentId } = c.req.valid("param");
        const result = await leaveTournament(db, {
          tournamentId,
          userId: token.userId,
        });

        if (!result.ok) {
          if (result.code === "NOT_FOUND")
            return c.json({ ok: false, code: "NOT_FOUND" }, 404);
          if (result.code === "ALREADY_STARTED")
            return c.json({ ok: false, code: "ALREADY_STARTED" }, 409);
          if (result.code === "OWNER_CANNOT_LEAVE")
            return c.json({ ok: false, code: "OWNER_CANNOT_LEAVE" }, 409);
        }

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

// ✅ default export (your server imports default)
export default tournamentParticipantsRoutes;
