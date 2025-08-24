//後端入口（Entry Point），啟動 API 伺服器、掛中介層、註冊路由，
//並提供 OpenAPI/Swagger 文件。
import { OpenAPIHono } from "@hono/zod-openapi";//Hono 是一個類似 Express/Fastify 的輕量 Web Framework，這裡用 OpenAPIHono 是為了整合 Zod schema 驗證與 OpenAPI 文件生成。
import { serve } from "@hono/node-server";//提供 serve 函數，讓我們在 Node.js 上跑 Hono 應用。
import { swaggerUI } from "@hono/swagger-ui";
import userRoutes from "./routes/userRoutes";
import gameRoutes from "./routes/gameRoutes";//專案的兩組 API 路由（分別對應使用者和遊戲邏輯）。
import { auth } from "./middlewares/auth";//中介層（middleware），負責驗證使用者（通常會檢查 JWT）。

const app = new OpenAPIHono();

// middleware
app.use('/api/users/me', auth);
app.use('/api/users/enable-2fa', auth);

//把 userRoutes.ts 和 gameRoutes.ts 裡定義的 API 全部註冊到 app 上。
//這樣 index.ts 不需要知道每個 API 的細節，只負責總裝配。
userRoutes(app);
gameRoutes(app);

// Swagger UI: http://localhost:4001/ui
//提供 Swagger UI 頁面
app.get(
  "/ui",
  swaggerUI({
    url: "/doc",
  })
);

//提供 OpenAPI 文件 JSON
// OpenAPI Docs: http://localhost:4001/doc
app.doc("/doc", {
  info: {
    title: "Best Pong Pong Game API",
    version: "1.0.0",
    description: "API for managing users, authentication, and the Pong game.",
  },
  openapi: "3.0.0",
});


//啟動伺服器
const port = parseInt(process.env["PORT"] || "4001");

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
