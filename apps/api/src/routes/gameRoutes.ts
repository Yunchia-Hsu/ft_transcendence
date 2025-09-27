import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { db } from "infra/db/index.js";
import {
  gameStartSchema,
  moveSchema,
  moveParamSchema,
  gameSchema,
  gameParamSchema,
  listGamesQuerySchema,
  makeMoveSuccessSchema,
  completeGameBodySchema,
  completeGameOkSchema,
  completeGameErrSchema,
} from "../schemas/gameSchemas.js";
import {
  startGame,
  getGameStatus,
  makeMove,
  listGames,
  completeGame,
} from "../controllers/games.js";

const gameRoutes = (app: OpenAPIHono) => {
  // POST /api/games/start
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/start",
      request: {
        body: {
          content: { "application/json": { schema: gameStartSchema } },
          required: true,
        },
      },
      responses: {
        201: {
          description: "Game started",
          content: { "application/json": { schema: gameSchema } },
        },
        400: { description: "Invalid input" },
      },
      tags: ["games"],
      summary: "Start a manual game",
      operationId: "startGame",
    }),
    async (c) => {
      const body = await c.req.json();
      const parsed = gameStartSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const { player1, player2 } = parsed.data;
      const newGame = await startGame(db, { player1, player2 });
      return c.json(newGame, 201);
    }
  );

  // GET /api/games/{gameId}
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/games/{gameId}",
      request: { params: gameParamSchema },
      responses: {
        200: {
          description: "Game status",
          content: { "application/json": { schema: gameSchema } },
        },
        400: { description: "Invalid gameId" },
        404: { description: "Game not found" },
      },
      tags: ["games"],
      summary: "Get game status by ID",
      operationId: "getGameStatus",
    }),
    async (c) => {
      const { gameId } = c.req.valid("param");
      const gameStatus = await getGameStatus(db, gameId);
      if (!gameStatus) return c.json({ error: "Game not found" }, 404);
      return c.json(gameStatus, 200);
    }
  );

  // POST /api/games/{gameId}/move
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/{gameId}/move",
      request: {
        params: moveParamSchema,
        body: {
          content: { "application/json": { schema: moveSchema } },
          required: true,
        },
      },
      responses: {
        200: {
          description: "Move processed",
          content: { "application/json": { schema: makeMoveSuccessSchema } },
        },
        400: { description: "Invalid move or payload" },
        403: { description: "Player not in game" },
        404: { description: "Game not found" },
        500: { description: "Server error" },
      },
      tags: ["games"],
      summary: "Submit a move for a game",
      operationId: "makeMove",
    }),
    async (c) => {
      try {
        const { gameId } = c.req.valid("param");
        const body = await c.req.json();
        const parsed = moveSchema.safeParse(body);
        if (!parsed.success)
          return c.json(
            { ok: false, code: "INVALID_MOVE", issues: parsed.error.issues },
            400
          );

        const result = await makeMove(db, gameId, parsed.data);

        if (!result.ok) {
          if (result.code === "GAME_NOT_FOUND")
            return c.json({ ok: false, code: result.code }, 404);
          if (result.code === "PLAYER_NOT_IN_GAME")
            return c.json({ ok: false, code: result.code }, 403);
          if (result.code === "INVALID_MOVE")
            return c.json({ ok: false, code: result.code }, 400);
          return c.json({ ok: false, code: "UNKNOWN_ERROR" }, 500);
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

  // GET /api/games
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/games",
      request: { query: listGamesQuerySchema },
      responses: {
        200: {
          description: "List of games",
          content: { "application/json": { schema: gameSchema.array() } },
        },
      },
      tags: ["games"],
      summary: "List games (filter by status/player)",
      operationId: "listGames",
    }),
    async (c) => {
      const query = c.req.valid("query");
      const games = await listGames(db, query);
      return c.json(games, 200);
    }
  );

  // POST /api/games/{gameId}/complete — mark as completed
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/{gameId}/complete",
      request: {
        params: gameParamSchema,
        body: {
          content: { "application/json": { schema: completeGameBodySchema } },
          required: false,
        },
      },
      responses: {
        200: {
          description: "Game completed",
          content: { "application/json": { schema: completeGameOkSchema } },
        },
        404: {
          description: "Game not found",
          content: { "application/json": { schema: completeGameErrSchema } },
        },
        409: {
          description: "Game already completed",
          content: { "application/json": { schema: completeGameErrSchema } },
        },
        500: { description: "Server error" },
      },
      tags: ["games"],
      summary: "Complete a game (set status to Completed, optional score)",
      operationId: "completeGame",
    }),
    async (c) => {
      try {
        const { gameId } = c.req.valid("param");
        const body = (await c.req.json().catch(() => ({}))) as {
          score?: string;
          winnerId?: string;
        };
        const res = await completeGame(db, gameId, body);

        if (!res.ok) {
          if (res.code === "GAME_NOT_FOUND") return c.json(res, 404);
          if (res.code === "ALREADY_COMPLETED") return c.json(res, 409);
        }

        return c.json(res, 200);
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

export default gameRoutes;
