import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { db } from "infra/db/index.js";
import { enqueue, dequeue, getStatus } from "../controllers/matchmaking.js";
import {
  enqueueBodySchema,
  enqueueResponseQueuedSchema,
  enqueueResponseMatchedSchema,
  enqueueResponseConflictSchema,
  enqueueErrorSchema,
  dequeueBodySchemaRt,
  statusParamsSchema,
  statusResponseSchema,
} from "../schemas/matchmakingSchemas.js";

const matchmakingRoutes = (app: OpenAPIHono) => {
  // const db = createDb();

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/matchmaking/queue",
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: enqueueBodySchema } },
        },
      },
      responses: {
        201: {
          description: "Queued or matched",
          content: {
            "application/json": {
              schema: enqueueResponseQueuedSchema.or(
                enqueueResponseMatchedSchema
              ),
            },
          },
        },
        200: {
          description: "Already queued (idempotent)",
          content: {
            "application/json": { schema: enqueueResponseQueuedSchema },
          },
        },
        400: {
          description: "Invalid body",
          content: { "application/json": { schema: enqueueErrorSchema } },
        },
        409: {
          description: "Already in active game",
          content: {
            "application/json": { schema: enqueueResponseConflictSchema },
          },
        },
        500: { description: "Server error" },
      },
      tags: ["matchmaking"],
      summary: "Enqueue for quick play (pair if opponent waiting)",
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const parsed = enqueueBodySchema.safeParse(body);
        if (!parsed.success) {
          return c.json(
            {
              ok: false,
              code: "INVALID_BODY",
              issues: parsed.error.issues,
            } as const,
            400
          );
        }

        // For now, userId comes from body; later use auth.
        const { userId, mode = "1v1" } = parsed.data;
        const result = await enqueue(db, userId, mode);

        switch (result.type) {
          case "QUEUED":
            return c.json(
              { status: "queued", userId: result.userId, mode },
              201
            );
          case "ALREADY_IN_QUEUE":
            return c.json(
              { status: "queued", userId: result.userId, mode },
              200
            );
          case "MATCHED":
            return c.json(
              {
                status: "matched",
                userId: result.userId,
                opponent: { userId: result.opponentUserId },
                matchId: result.matchId,
              },
              201
            );
          case "ALREADY_IN_GAME":
            return c.json({ ok: false, code: "ALREADY_IN_GAME" } as const, 409);
        }
      } catch (err) {
        console.error("enqueue error:", err);
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR",
            message: (err as Error).message,
          } as const,
          500
        );
      }
    }
  );

  // DELETE /api/matchmaking/queue — leave queue
  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/matchmaking/queue",
      // NOTE: no request.body declared → Swagger won’t show body schema
      responses: {
        200: { description: "Left queue (returns ok + removed flag)" },
        400: { description: "Invalid body" },
        500: { description: "Server error" },
      },
      tags: ["matchmaking"],
      summary: "Leave the matchmaking queue",
    }),
    async (c) => {
      try {
        const raw = await c.req.text();
        if (!raw.trim()) {
          return c.json({ ok: false, code: "INVALID_BODY" } as const, 400);
        }

        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return c.json({ ok: false, code: "INVALID_BODY" } as const, 400);
        }

        const parsed = dequeueBodySchemaRt.safeParse(body);
        if (!parsed.success) {
          return c.json(
            {
              ok: false,
              code: "INVALID_BODY",
              issues: parsed.error.issues,
            } as const,
            400
          );
        }

        const { userId } = parsed.data;
        const { removed } = await dequeue(db, userId);
        if (!removed) {
          return c.json({ ok: false, code: "NOT_FOUND", userId } as const, 404);
        }

        return c.json({ ok: true, removed, userId }, 200);
      } catch (err) {
        console.error("dequeue error:", err);
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR",
            message: (err as Error).message,
          } as const,
          500
        );
      }
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/matchmaking/status/{userId}", // 👈 path param
      request: {
        params: statusParamsSchema,
      },
      responses: {
        200: {
          description: "Current matchmaking status",
          content: { "application/json": { schema: statusResponseSchema } },
        },
        400: {
          description: "Invalid param",
          content: { "application/json": { schema: enqueueErrorSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["matchmaking"],
      summary: "Get matchmaking status for the given user",
    }),
    async (c) => {
      try {
        // validated userId from path
        const { userId } = c.req.valid("param");
        const result = await getStatus(db, userId);
        return c.json(result, 200);
      } catch (err) {
        return c.json(
          {
            ok: false,
            code: "SERVER_ERROR",
            message: (err as Error).message,
          } as const,
          500
        );
      }
    }
  );
};

export default matchmakingRoutes;
