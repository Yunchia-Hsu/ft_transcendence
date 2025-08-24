import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createDb } from "infra/db/index.js";
import { enqueue } from "../controllers/matchmaking.js";
import {
  enqueueBodySchema,
  enqueueResponseSchema,
} from "../schemas/matchmakingSchemas.js";

const matchmakingRoutes = (app: OpenAPIHono) => {
  const db = createDb();

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/matchmaking/queue",
      request: {
        body: {
          content: { "application/json": { schema: enqueueBodySchema } },
        },
      },
      responses: {
        200: {
          description:
            "Enqueued or matched. Returns {matched:false} or {matched:true, game} or {ok:false, reason:'ALREADY_IN_GAME'}",
          content: { "application/json": { schema: enqueueResponseSchema } },
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
              reason: "INVALID_BODY",
              issues: parsed.error.issues,
            } as const,
            200
          );
        }
        const result = await enqueue(db, parsed.data.userId);
        return c.json(result, 200);
      } catch (err) {
        console.error("enqueue error:", err);
        return c.json(
          {
            ok: false,
            reason: "SERVER_ERROR",
            message: (err as Error).message,
          },
          500
        );
      }
    }
  );
};

export default matchmakingRoutes;
