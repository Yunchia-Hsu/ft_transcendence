import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createDb } from "infra/db/index.js";
import { enqueue } from "../controllers/matchmaking.js";
import {
  enqueueBodySchema,
  enqueueResponseQueuedSchema,
  enqueueResponseMatchedSchema,
  enqueueResponseConflictSchema,
  enqueueErrorSchema,
} from "../schemas/matchmakingSchemas.js";

const matchmakingRoutes = (app: OpenAPIHono) => {
  const db = createDb();

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
};

export default matchmakingRoutes;
