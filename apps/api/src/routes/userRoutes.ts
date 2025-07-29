import {
  registerSchema,
  loginSchema,
  userProfileSchema,
} from "../schemas/userSchemas";

import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../controllers/users";

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const userRoutes = (app: OpenAPIHono) => {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/users/register",
      responses: {
        201: { description: "User registered successfully" },
        400: { description: "Invalid input" },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = registerSchema.safeParse(body);
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { username, email, password } = result.data;
      const newUser = await registerUser({ username, email, password });
      return c.json(newUser, 201);
    }
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/users/login",
      responses: {
        200: { description: "Login successful" },
        401: { description: "Unauthorized" },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = loginSchema.safeParse(body);
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { username, password } = result.data;
      const { token, userId } = await loginUser({ username, password });
      return c.json({ token, userId });
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/users/:userId",
      responses: {
        200: { description: "User details" },
        404: { description: "User not found" },
      },
    }),
    async (c) => {
      const { userId } = c.req.param();
      const user = await getUserProfile(userId);
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(user);
    }
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/api/users/:userId",
      responses: {
        200: { description: "User updated successfully" },
        404: { description: "User not found" },
      },
    }),
    async (c) => {
      const { userId } = c.req.param();
      const body = await c.req.json();
      const result = userProfileSchema.safeParse(body);
      if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
      }

      const { username, email } = result.data;
      const updatedUser = await updateUserProfile(userId, { username, email });
      if (!updatedUser) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(updatedUser);
    }
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/users/:userId",
      responses: {
        200: { description: "User deleted successfully" },
        404: { description: "User not found" },
      },
    }),
    async (c) => {
      const { userId } = c.req.param();
      const result = await deleteUserProfile(userId);
      if (!result) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(result);
    }
  );
};

export default userRoutes;
