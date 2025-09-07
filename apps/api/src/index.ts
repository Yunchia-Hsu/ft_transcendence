import { OpenAPIHono } from "@hono/zod-openapi";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import userRoutes from "./routes/userRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import matchmakingRoutes from "./routes/matchmakingRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import tournamentParticipantsRoutes from "./routes/tournaments.participants.js";
import tournamentLifecycleRoutes from "./routes/tournaments.lifecycle.js";
import { initDB } from "infra/db/index.js";
import { config } from "dotenv";

const app = new OpenAPIHono();
await initDB();
userRoutes(app);
gameRoutes(app);
matchmakingRoutes(app);
tournamentRoutes(app);
tournamentParticipantsRoutes(app);
tournamentLifecycleRoutes(app);

// Swagger UI: http://localhost:4001/ui
app.get(
  "/ui",
  swaggerUI({
    url: "/doc",
  })
);

// OpenAPI Docs: http://localhost:4001/doc
app.doc("/doc", {
  info: {
    title: "Best Pong Game API",
    version: "1.0.0",
    description: "API for managing users, authentication, and the Pong game.",
  },
  openapi: "3.0.0",
});

const port = parseInt(process.env["PORT"] || "4001"); //take from .env or use 4001

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  }
);

export default app;
