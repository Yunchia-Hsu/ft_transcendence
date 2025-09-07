import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "infra/db/index.js"; // ✅ singleton
import { verifyToken } from "../utils/auth.js";
import {
  startTournament,
  recordMatchResult,
  getBracket,
} from "../controllers/tournamentLifecycle.js";

import {
  tournamentIdParamSchema,
  startResponseSchema,
  startErrorSchema,
  recordMatchBodySchema,
  recordMatchOkSchema,
  recordMatchErrSchema,
  bracketOkSchema,
  bracketErrSchema,
} from "../schemas/tournamentLifecycleSchemas.js";

const tournamentLifecycleRoutes = (app: OpenAPIHono) => {
  // POST /api/tournaments/{tournamentId}/start
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/tournaments/{tournamentId}/start",
      request: {
        params: tournamentIdParamSchema,
        headers: z.object({
          authorization: z.string().describe("Bearer <JWT>"),
        }),
      },
      responses: {
        200: {
          description: "Started",
          content: { "application/json": { schema: startResponseSchema } },
        },
        401: {
          description: "Unauthorized",
          content: { "application/json": { schema: startErrorSchema } },
        },
        403: {
          description: "Forbidden (not owner)",
          content: { "application/json": { schema: startErrorSchema } },
        },
        404: {
          description: "Not found",
          content: { "application/json": { schema: startErrorSchema } },
        },
        409: {
          description:
            "Conflict (already started / insufficient participants / size invalid)",
          content: { "application/json": { schema: startErrorSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Start tournament (locks bracket)",
      operationId: "startTournament",
    }),
    async (c) => {
      try {
        const { tournamentId } = c.req.valid("param");
        const auth =
          c.req.header("authorization") ?? c.req.header("Authorization");
        if (!auth) {
          return c.json({ ok: false, code: "UNAUTHORIZED" as const }, 401);
        }
        const token = verifyToken(auth);
        if (!token.valid || !token.userId) {
          return c.json({ ok: false, code: "UNAUTHORIZED" as const }, 401);
        }

        const result = await startTournament(db, {
          tournamentId,
          startedByUserId: token.userId,
        });

        if (!result.ok) {
          switch (result.code) {
            case "NOT_FOUND":
              return c.json(result, 404);
            case "FORBIDDEN":
              return c.json(result, 403);
            case "ALREADY_STARTED":
            case "INSUFFICIENT_PARTICIPANTS":
            case "SIZE_NOT_POWER_OF_TWO":
              return c.json(result, 409);
          }
        }
        return c.json(result, 200);
      } catch (err) {
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR" as const,
            message: (err as Error).message,
          },
          500
        );
      }
    }
  );

  // POST /api/tournaments/{tournamentId}/matches — record result
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/tournaments/{tournamentId}/matches",
      request: {
        params: tournamentIdParamSchema,
        headers: z.object({
          authorization: z.string().describe("Bearer <JWT>"),
        }),
        body: {
          required: true,
          content: { "application/json": { schema: recordMatchBodySchema } },
        },
      },
      responses: {
        200: {
          description: "Recorded",
          content: { "application/json": { schema: recordMatchOkSchema } },
        },
        401: {
          description: "Unauthorized",
          content: { "application/json": { schema: recordMatchErrSchema } },
        },
        404: {
          description: "Tournament or match not found",
          content: { "application/json": { schema: recordMatchErrSchema } },
        },
        409: {
          description:
            "Conflict (not ongoing / invalid winner / already reported)",
          content: { "application/json": { schema: recordMatchErrSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Record a match result (advance winner)",
      operationId: "recordMatchResult",
    }),
    async (c) => {
      try {
        const { tournamentId } = c.req.valid("param");
        const auth =
          c.req.header("authorization") ?? c.req.header("Authorization");
        if (!auth)
          return c.json({ ok: false, code: "UNAUTHORIZED" as const }, 401);
        const token = verifyToken(auth);
        if (!token.valid || !token.userId) {
          return c.json({ ok: false, code: "UNAUTHORIZED" as const }, 401);
        }

        const body = await c.req.json();
        const parsed = recordMatchBodySchema.safeParse(body);
        if (!parsed.success) {
          return c.json(
            {
              ok: false as const,
              code: "SERVER_ERROR" as const,
              message: "Invalid body",
            },
            400
          );
        }

        const result = await recordMatchResult(db, {
          tournamentId,
          round: parsed.data.round,
          matchIndex: parsed.data.matchIndex,
          winnerUserId: parsed.data.winnerUserId,
        });

        if (!result.ok) {
          switch (result.code) {
            case "NOT_FOUND":
              return c.json(result, 404);
            case "MATCH_NOT_FOUND":
              return c.json(result, 404);
            case "NOT_ONGOING":
            case "INVALID_WINNER":
            case "ALREADY_REPORTED":
              return c.json(result, 409);
          }
        }
        return c.json(result, 200);
      } catch (err) {
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR" as const,
            message: (err as Error).message,
          },
          500
        );
      }
    }
  );

  // GET /api/tournaments/{tournamentId}/bracket
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/tournaments/{tournamentId}/bracket",
      request: { params: tournamentIdParamSchema },
      responses: {
        200: {
          description: "Bracket view",
          content: { "application/json": { schema: bracketOkSchema } },
        },
        404: {
          description: "Not found",
          content: { "application/json": { schema: bracketErrSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Current bracket tree",
      operationId: "getTournamentBracket",
    }),
    async (c) => {
      try {
        const { tournamentId } = c.req.valid("param");
        const result = await getBracket(db, tournamentId);
        if (!result.ok) return c.json(result, 404);
        return c.json(result, 200);
      } catch (err) {
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR" as const,
            message: (err as Error).message,
          },
          500
        );
      }
    }
  );
};

export default tournamentLifecycleRoutes;
