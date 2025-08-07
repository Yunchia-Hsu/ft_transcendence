import {
  registerSchema,
  loginSchema,
  userProfileSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  enable2FASchema,
} from "../schemas/userSchemas";

//controller
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
  refreshToken,
  logoutUser,
  getMe,
  verifyEmail,
  enable2FA,
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
      path: "/api/users",
      responses: {
        200: { description: "List of users" },
        404: { description: "No users found" },
      },
    }),
    async (c) => {
      const users = await getAllUsers();
      if (!users || users.length === 0) {
        return c.json({ error: "No users found" }, 404);
      }
      return c.json(users);
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

/* 新增：refresh  */
  
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/users/refresh',
      responses: {
        200: { description: 'New access / refresh token' },
        400: { description: 'Invalid token' },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = refreshSchema.safeParse(body);
      if (!result.success) return c.json({ error: result.error.issues }, 400);

      const tokens = await refreshToken(result.data);
      return c.json(tokens);
    }
  );

  /* logout */
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/users/logout',
      responses: {
        200: { description: 'Logged out' },
        400: { description: 'Invalid token' },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = logoutSchema.safeParse(body);
      if (!result.success) return c.json({ error: result.error.issues }, 400);

      const res = await logoutUser(result.data);
      return c.json(res);
    }
  );

  /* /me (need JWT middleware)  */
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/users/me',
      security: [{ bearerAuth: [] }], // display on Swagger  need JWT
      responses: {
        200: { description: 'Current user info' },
        401: { description: 'Unauthorized' },
      },
    }),
    async (c) => {
      const userId = c.get('userId'); // get JWT middleware
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const me = await getMe(userId);
      return c.json(me);
    }
  );

  /* ─────────── 新增：verify-email ─────────── */
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/users/verify-email',
      responses: {
        200: { description: 'Email verified' },
        400: { description: 'Invalid code' },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = verifyEmailSchema.safeParse(body);
      if (!result.success) return c.json({ error: result.error.issues }, 400);

      const res = await verifyEmail(result.data);
      return c.json(res);
    }
  );

  /* ─────────── 新增：enable-2fa (需要 JWT middleware) ─────────── */
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/users/enable-2fa',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: '2FA enabled' },
        400: { description: 'Invalid TOTP' },
        401: { description: 'Unauthorized' },
      },
    }),
    async (c) => {
      const body = await c.req.json();
      const result = enable2FASchema.safeParse(body);
      if (!result.success) return c.json({ error: result.error.issues }, 400);

      const userId = c.get('userId');
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const res = await enable2FA({ ...result.data, userId });
      return c.json(res);
    }
  );
};



export default userRoutes;
