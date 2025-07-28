import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { serve } from "@hono/node-server";

const app = new OpenAPIHono();

// Define OpenAPI route for "GET /hello"
app.openapi(
  createRoute({
    method: "get",
    path: "/hello",
    responses: {
      200: {
        description: "Respond with a Hello message",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      message: "Hello World", // Correctly return a valid JSON response
    });
  }
);

// Set up Swagger UI to view OpenAPI docs at /ui
app.get(
  "/ui",
  swaggerUI({
    url: "/doc", // Link to OpenAPI documentation URL
  })
);

// Set up OpenAPI documentation at /doc
app.doc("/doc", {
  info: {
    title: "YKI Success API",
    version: "1.0.0",
  },
  openapi: "3.0.0", // OpenAPI version
});

// Port configuration (either from environment or default to 4000)
const port = parseInt(process.env["PORT"] || "4001"); // Change to 4001 to avoid port conflict

// Start the server
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
