import {
  gameStartSchema,
  gameStatusSchema,
  moveSchema,
  gameSchema,
  listGamesQuerySchema,
} from "../schemas/gameSchemas.js";
import {
  startGame,
  getGameStatus,
  makeMove,
  listGames,
} from "../controllers/games.js";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createDb, db } from "infra/db/index.js"; // ✅ use factory instead of singleton
import app from "src/index.js";

const gameRoutes = (app: OpenAPIHono) => {
  // create a DB instance for this route module
  const db = createDb();

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/start",
      request: {
        body: {
          content: {
            "application/json": { schema: gameStartSchema },
          },
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
      const result = gameStartSchema.safeParse(body);

      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { player1, player2 } = result.data;
      const newGame = await startGame(db, { player1, player2 }); // pass db
      return c.json(newGame, 201);
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/games/:gameId",
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
      const { gameId } = c.req.param();
      const result = gameStatusSchema.safeParse({ gameId });

      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const gameStatus = await getGameStatus(db, gameId); // pass db
      if (!gameStatus) {
        return c.json({ error: "Game not found" }, 404);
      }

      return c.json(gameStatus);
    }
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/:gameId/move",
      request: {
        body: {
          content: {
            "application/json": { schema: moveSchema },
          },
        },
      },
      responses: {
        200: { description: "Move processed" },
        400: { description: "Invalid move" },
      },
      tags: ["games"],
      summary: "Submit a move for a game",
      operationId: "makeMove",
    }),
    async (c) => {
      const { gameId } = c.req.param();
      const body = await c.req.json();
      const result = moveSchema.safeParse(body);

      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { playerId, move } = result.data;
      const response = await makeMove(db, gameId, { playerId, move }); // pass db
      return c.json(response);
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/games",
      request: {
        query: listGamesQuerySchema, // ✅ zod-openapi validates this
      },
      responses: {
        200: {
          description: "List of games",
          content: {
            "application/json": {
              schema: gameSchema.array(),
            },
          },
        },
      },
      tags: ["games"],
      summary: "List games (filter by status/player)",
      operationId: "listGames",
    }),
    async (c) => {
      // ✅ parsed & typed query (throws 400 automatically if invalid)
      const query = c.req.valid("query"); // { status?: string; player?: string }

      const games = await listGames(db, query);
      return c.json(games, 200);
    }
  );
};

export default gameRoutes;
