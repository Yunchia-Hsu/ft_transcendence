
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
  
// get all users
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
// get other user
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
    // update user info
  // app.openapi(
  //   createRoute({
  //     method: "put",
  //     path: "/api/auth/users/:userId",
  //     responses: {
  //       200: { description: "User updated successfully" },
  //       404: { description: "User not found" },
  //     },
  //   }),
  //   async (c) => {
  //     const { userId } = c.req.param();
  //     const body = await c.req.json();
  //     const result = userProfileSchema.safeParse(body);
  //     if (!result.success) {
  //       return c.json({ error: result.error.issues }, 400);
  //     }

  //     const { username, displayname } = result.data;
  //     const updatedUser = await updateUserProfile(userId, { username, displayname });
  //     if (!updatedUser) {
  //       return c.json({ error: "User not found" }, 404);
  //     }
  //     return c.json(updatedUser);
  //   }
  // );

// update user name , displayname
  app.openapi(
    createRoute({
      method: "put",
      path: "/api/auth/users/:userId",
      request: {
        body: {
          content: {
            "application/json": {
              schema: userProfileSchema,
            },
          },
        },
        headers: z.object({
          authorization: z.string().describe("Bearer token for authentication"),
        }),
      },
      responses: {
        200: { 
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                username: z.string(),
                displayname: z.string().nullable(),
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
          description: "Unauthorized",
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
      },
    }),
    async (c) => {
      try {
        // 1. Verify authentication
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization header is required" }, 401);
        }
  
        const tokenVerification = verifyToken(authHeader);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }
  
        // 2. Get userId from URL params
        const { userId } = c.req.param();
        
        // 3. Optional: Check if user can only update their own profile
        if (tokenVerification.userId !== userId) {
          return c.json({ error: "You can only update your own profile" }, 403);
        }
  
        // 4. Parse and validate request body
        const body = await c.req.json();
        const result = userProfileSchema.safeParse(body);
        if (!result.success) {
          return c.json({ error: result.error.issues }, 400);
        }
  
        // 5. Update user profile
        const { username, displayname } = result.data;
        const updatedUser = await updateUserProfile(userId, { username, displayname });
        
        if (!updatedUser) {
          return c.json({ error: "User not found" }, 404);
        }
  
        return c.json(updatedUser, 200);
      } catch (error) {
        console.error('Error updating user profile:', error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );
//test
// curl -X PUT http://localhost:4001/api/auth/users/a2a931e5-8eed-4d3e-ab22-b957ad644116 \
//   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMmE5MzFlNS04ZWVkLTRkM2UtYWIyMi1iOTU3YWQ2NDQxMTYiLCJ1c2VybmFtZSI6IjY2NiIsImVtYWlsIjoiNjY2QGV4YW1wbGUuY29tIiwiaWF0IjoxNzU2NDkxNDA2LCJleHAiOjE3NTY2NjQyMDZ9.yE1mR5BZX3CiCzsLvF9g_t4lh_gmqS3DDUy7Y4f0rXo" \
//   -H "Content-Type: application/json" \
//   -d '{"username":"666","displayname":"im number six"}'


  //delete user
  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/auth/users/:userId",
      request: {
        headers: z.object({
          authorization: z.string().describe("Bearer token for authentication"),
        }),
      },
      responses: {
        200: { 
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        401: { 
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        403: {
          description: "Forbidden - Cannot delete other users",
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
        // 1. Verify authentication
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization header is required" }, 401);
        }
  
        const tokenVerification = verifyToken(authHeader);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }
  
        // 2. Get userId from URL params (fix: was incorrectly using email)
        const { userId } = c.req.param();
        
        // 3. Check if user can only delete their own account
        if (tokenVerification.userId !== userId) {
          return c.json({ error: "You can only delete your own account" }, 403);
        }
  
        // 4. Delete user
        const result = await deleteUserProfile(userId);
        if (!result) {
          return c.json({ error: "User not found" }, 404);
        }
        return c.json(result, 200);
        
      } catch (error) {
        console.error('Error deleting user:', error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );
  //test : 
  // curl -X DELETE http://localhost:4001/api/auth/users/a2a931e5-8eed-4d3e-ab22-b957ad644116 \
  // -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMmE5MzFlNS04ZWVkLTRkM2UtYWIyMi1iOTU3YWQ2NDQxMTYiLCJ1c2VybmFtZSI6IjY2NiIsImVtYWlsIjoiNjY2QGV4YW1wbGUuY29tIiwiaWF0IjoxNzU2NDkxNDA2LCJleHAiOjE3NTY2NjQyMDZ9.yE1mR5BZX3CiCzsLvF9g_t4lh_gmqS3DDUy7Y4f0rXo"


// show me my own info
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
// curl -X GET http://localhost:4001/api/auth/me \
//   -H "Authorization: Bearer eyeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNzAwOTJjYy1kMGJhLTQzMTktOTk0Yi1hZTY4MzdlZGE1NzEiLCJ1c2VybmFtZSI6IjIyMiIsImVtYWlsIjoiMjIyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU2NDkyOTA4LCJleHAiOjE3NTY2NjU3MDh9.6Mf5SVmo8EfmLgrNLA0-UMICnIqRcfeMd0YiRiqc034"

*/




export default userRoutes;
