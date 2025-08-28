import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createDb } from "infra/db/index.js";
import {
  tournamentCreateSchema,
  tournamentItemSchema,
  tournamentsListResponseSchema,
} from "../schemas/tournamentSchemas.js";
import {
  createTournament,
  listTournaments,
} from "../controllers/tournaments.js";

const tournamentRoutes = (app: OpenAPIHono) => {
  const db = createDb();

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/tournaments",
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: tournamentCreateSchema } },
        },
      },
      responses: {
        201: {
          description: "Created",
          content: { "application/json": { schema: tournamentItemSchema } },
        },
        400: { description: "Invalid body" },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Create tournament (admin/organizer)",
      operationId: "createTournament",
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const parsed = tournamentCreateSchema.safeParse(body);
        if (!parsed.success) {
          return c.json(
            { ok: false, code: "INVALID_BODY", issues: parsed.error.issues },
            400
          );
        }

        // TODO: auth/role check (admin/organizer)
        const created = await createTournament(db, parsed.data);
        return c.json(created, 201);
      } catch (err) {
        return c.json(
          { ok: false, code: "SERVER_ERROR", message: (err as Error).message },
          500
        );
      }
    }
  );
  // GET /api/tournaments — list
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/tournaments",
      responses: {
        200: {
          description: "List tournaments",
          content: {
            "application/json": { schema: tournamentsListResponseSchema },
          },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "List tournaments",
      operationId: "listTournaments",
    }),
    async (c) => {
      try {
        const result = await listTournaments(db);
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

export default tournamentRoutes;
