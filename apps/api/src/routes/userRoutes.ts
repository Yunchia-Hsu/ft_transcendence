
import {
  registerSchema,
  loginSchema,
  userProfileSchema,
  userMeResponseSchema,
} from "../schemas/userSchemas.js";

import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
  getCurrentUser,  
} from "../controllers/users.js";

import { verifyToken } from "../utils/auth.js"; // for get me 
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getUserByUsername, getUserByEmail } from '../../../../packages/infra/db/index.js';
//let JWT_SECRET = "key_for_test",// need to add to env.

const userRoutes = (app: OpenAPIHono) => {
  
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/auth/users/register",
      request: {
        body: {
          content: {
            "application/json": {
              schema: registerSchema,
            },
          },
        },
      },
      responses: {
        201: { 
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                username: z.string(),
                email: z.string(),
                createdAt: z.string(),
              }),
            },
          },
        },
        400: { 
          description: "Invalid input",
          content: {
            "application/json": {
              schema: z.object({
                error: z.array(z.any()),
              }),
            },
          },
        },
        409: {
          description: "User already exists",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {  
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const result = registerSchema.safeParse(body);
        
        if (!result.success) {
          return c.json({ error: result.error.issues }, 400);
        }

        const { username, email, password } = result.data;
        
        // call controller to encrypt password
        const newUser = await registerUser({ username, email, password });
         
        return c.json(newUser, 201);
        
      } catch (error) {
        console.error('Registration error:', error);
        
        // existed users
        if (error instanceof Error && error.message.includes('already exists')) {
          return c.json({ error: "User already exists" }, 409);
        }
        
        return c.json({ error: "Registration failed" }, 500);
      }
    }
  );
  

  
  // use username and password to log in
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/auth/users/login",
      request: {
        body: {
          content: {
            "application/json": {
              schema: loginSchema,
            },
          },
        },
      },
      responses: {
        200: { 
          description: "Login successful",
          content: {
            "application/json": {
              schema: z.object({
                token: z.string(),
                userId: z.string(),
              }),
            },
          },
        },
        400: { 
          description: "Invalid input",
          content: {
            "application/json": {
              schema: z.object({
                error: z.array(z.any()),
              }),
            },
          },
        },
        401: { 
          description: "Unauthorized - Invalid credentials",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const result = loginSchema.safeParse(body);
        
        if (!result.success) {
          return c.json({ error: result.error.issues }, 400);
        }
  
        const { username, password } = result.data;
        const loginResult = await loginUser({ username, password });
        
        return c.json(loginResult, 200);
        
      } catch (error) {
        console.error('Login error:', error);
        
        // handle invalid credentials
        if (error instanceof Error && (   
          error.message.includes('not found') || 
          error.message.includes('Invalid credentials')
        )) {
          return c.json({ error: "Invalid credentials" }, 401);
        }
        
        return c.json({ error: "Login failed" }, 500);
      }
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/auth/users",
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
      path: "/api/auth/users/:userId",
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
      path: "/api/auth/users/:userId",
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
      path: "/api/auth/users/:userId",
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

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/auth/me",
      request: {
        headers: z.object({
          authorization: z.string().describe("Bearer token for authentication"),
        }),
      },
      responses: {
        200: {
          description: "Current user information",
          content: {
            "application/json": {
              schema: userMeResponseSchema,
            },
          },
        },
        401: { 
          description: "Unauthorized - Invalid or missing token",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        404: { 
          description: "User not found",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        // 1. get Authorization header
        const authHeader = c.req.header("Authorization");
        console.log('tooooken: ', authHeader);
        if (!authHeader) {
          return c.json({ error: "Authorization header is required 未登入" }, 401);
        }

        // 2. veryfy token and get userId
        const tokenVerification = verifyToken(authHeader);
        console.log('userid: ', tokenVerification);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }
 
        // 3. retrieve user info
        if (!tokenVerification.userId) {
          return c.json({ error: "Invalid token: userId is missing" }, 401);
        }
        const userInfo = await getCurrentUser(tokenVerification.userId);
        if (!userInfo) {
          return c.json({ error: "User not found" }, 404);
        }

        // 4. return user info
        return c.json(userInfo, 200);

      } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );
};

/*
use command to test me router
curl -X GET http://localhost:4001/api/auth/me \
  -H "Authorization: Bearer ey"
*/





export default userRoutes;
