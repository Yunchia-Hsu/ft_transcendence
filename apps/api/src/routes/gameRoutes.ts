import {
  gameStartSchema,
  gameStatusSchema,
  moveSchema,
} from "../schemas/gameSchemas";
import { startGame, getGameStatus, makeMove } from "../controllers/games";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const gameRoutes = (app: OpenAPIHono) => {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/games/start",
      responses: {
        201: { description: "Game started" },
        400: { description: "Invalid input" },
      },
    }),
    async (c) => {
      const body = await c.req.json();

      const result = gameStartSchema.safeParse(body);
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { player1, player2 } = result.data;
      const newGame = await startGame({ player1, player2 });
      return c.json(newGame, 201);
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/games/:gameId",
      responses: {
        200: { description: "Game status" },
        404: { description: "Game not found" },
      },
    }),
    async (c) => {
      const { gameId } = c.req.param();

      const result = gameStatusSchema.safeParse({ gameId });
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const gameStatus = await getGameStatus(gameId);
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
      responses: {
        200: { description: "Move processed" },
        400: { description: "Invalid move" },
      },
    }),
    async (c) => {
      const { gameId } = c.req.param();
      const body = await c.req.json();

      const result = moveSchema.safeParse(body);
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { playerId, move } = result.data;
      const response = await makeMove(gameId, { playerId, move });
      return c.json(response);
    }
  );
};

export default gameRoutes;
