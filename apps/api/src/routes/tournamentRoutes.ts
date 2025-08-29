import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createDb } from "infra/db/index.js";
import {
  tournamentCreateSchema,
  tournamentItemSchema,
  tournamentsListResponseSchema,
  tournamentDetailSchema,
  tournamentIdParamSchema,
  errorSchema,
} from "../schemas/tournamentSchemas.js";
import {
  createTournament,
  listTournaments,
  getTournamentDetail,
  deleteTournament,
} from "../controllers/tournaments.js";

const tournamentRoutes = (app: OpenAPIHono) => {
  const db = createDb();

  // POST /api/tournaments — create
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
        const ownerId = c.req.header("x-user-id");
        if (!ownerId) {
          return c.json({ ok: false, code: "UNAUTHORIZED" } as const, 401);
        }

        const created = await createTournament(db, parsed.data, ownerId);
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

  // GET /api/tournaments/{tournamentId} — details
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/tournaments/{tournamentId}",
      request: { params: tournamentIdParamSchema },
      responses: {
        200: {
          description: "Tournament details",
          content: { "application/json": { schema: tournamentDetailSchema } },
        },
        404: { description: "Not found" },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Get tournament details",
      operationId: "getTournamentDetail",
    }),
    async (c) => {
      try {
        const { tournamentId } = c.req.valid("param");
        const detail = await getTournamentDetail(db, tournamentId);
        if (!detail) return c.json({ ok: false, code: "NOT_FOUND" }, 404);
        return c.json(detail, 200);
      } catch (err) {
        return c.json(
          { ok: false, code: "SERVER_ERROR", message: (err as Error).message },
          500
        );
      }
    }
  );

  // DELETE /api/tournaments/{tournamentId} — delete
  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/tournaments/{tournamentId}",
      request: { params: tournamentIdParamSchema },
      responses: {
        204: { description: "Tournament deleted" },
        404: {
          description: "Not found",
          content: {
            "application/json": {
              schema: errorSchema,
              examples: {
                notFound: { value: { ok: false, code: "NOT_FOUND" } },
              },
            },
          },
        },
        500: { description: "Server error" },
      },
      tags: ["tournaments"],
      summary: "Delete a tournament (admin/owner)",
      operationId: "deleteTournament",
    }),
    async (c) => {
      try {
        const { tournamentId } = c.req.valid("param");
        const result = await deleteTournament(db, tournamentId);
        if (result === "NOT_FOUND") {
          return c.json({ ok: false, code: "NOT_FOUND" } as const, 404);
        }
        return c.body(null, 204);
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

export default tournamentRoutes;
