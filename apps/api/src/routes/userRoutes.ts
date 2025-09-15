
import {
  registerSchema,
  loginSchema,
  userProfileSchema,
  userMeResponseSchema,
  setup2faSchema,
  activate2faSchema,
  verify2faSchema,
  FriendResponseSchema,
  FriendRequestBodySchema,
  FriendAcceptSchema,
  FriendRejecttSchema,
  FriendrequestreceiveSchema,
} from "../schemas/userSchemas.js";

import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
  getCurrentUser,
  setup2FA,
  activate2FA,
  verify2FA,  
  getOnlineUsers,
  updateUserStatus,
  getFriends,
  createFriendRequest,
  acceptFriendRequest,
  RejectedFriendRequest,
  deletefriendrequest,
  deletefriend,
} from "../controllers/users.js";
import type { JWTPayload } from "../utils/auth.js";
import jwt from 'jsonwebtoken';
import { extractUserIdFromToken, verifyToken } from "../utils/auth.js"; // for get me 
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getUserByUsername, db } from '../../../../packages/infra/db/index.js';


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
                error: z.string(),
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
      tags: ["users"],
      summary: "register users",
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const result = registerSchema.safeParse(body);
        
        if (!result.success) {
          return c.json({ error: JSON.stringify(result.error.issues) }, 400);
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
                token: z.string().optional(),
                userId: z.string().optional(),
                requireTwoFactor: z.boolean().optional(),
                tempToken: z.string().optional(),
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
      tags: ["users"],
      summary: "user logs in"
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
      tags: ["users"],
      summary: "retrieve all users's info"
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
      tags: ["users"],
      summary: "retrieve other user's info"
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
        403: { 
          description: "You can only update your own profile",
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
      tags: ["users"],
      summary: "update me (user's) name and displayname"
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
          return c.json({ error: tokenVerification.error || "Unauthorized" }, 401);
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
      tags: ["users"],
      summary: "delete me "
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
          return c.json({ error: tokenVerification.error || "unauthorized"}, 401);
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
        return c.json({ success: true, message: "Friend request deleted successfully" }, 200);
        
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
       tags: ["users"],
      summary: "retrieve my info"
    }),
    async (c) => {
      try {
        // 1. get Authorization header
        const authHeader = c.req.header("authorization");
        console.log('tooooken: ', authHeader);
        if (!authHeader) {
          return c.json({ error: "Authorization header is required " }, 401);
        }

        // 2. veryfy token and get userId
        const tokenVerification = verifyToken(authHeader);
        console.log('userid: ', tokenVerification);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error || "unauthorized" }, 401);
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


/*
use command to test me router
// curl -X GET http://localhost:4001/api/auth/me \
//   -H "Authorization: Bearer eyeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNzAwOTJjYy1kMGJhLTQzMTktOTk0Yi1hZTY4MzdlZGE1NzEiLCJ1c2VybmFtZSI6IjIyMiIsImVtYWlsIjoiMjIyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU2NDkyOTA4LCJleHAiOjE3NTY2NjU3MDh9.6Mf5SVmo8EfmLgrNLA0-UMICnIqRcfeMd0YiRiqc034"

*/

// 2fa
// POST api/auth/setup-2fa // 設定2FA (生成QR碼) 
// POST api/auth/activate-2fa // 啟用2FA (驗證首次設定)
//  POST api/auth/verify-2fa // 登入時驗證2FA碼



// // user state 

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/users/onlineusers",
      responses: {
        200: {
          description: "check Online users",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  userid: z.string(),
                  username: z.string(),
                  displayname: z.string().nullable(),
                  avatar: z.string().nullable(),
                  status: z.enum(["online", "offline"]),
                })
              ),
            },
          },
        },
      },
      tags: ["users status"],
      summary: "get online users list",
    }),
    async (c) => {
      const usersRaw = await getOnlineUsers();
      const users = usersRaw.map((u) => ({
        userid: u.userid,
        username: u.username,
        displayname: u.displayname ?? null,
        avatar: u.avatar ?? null,
        status: "online" as const,
      }));
      return c.json(users, 200);
    }
  );

  /* test update status
  curl -X PUT http://localhost:4001/api/users/<id>/status \
  -H "Authorization: Bearer ey..." \
  -H "Content-Type: application/json" \
  -d '{"status":"online"}'
  */
  app.openapi(
    createRoute({
      method: "put",
      //path: "/api/users/:userId/status",
      //path: "/api/users/me/updatestatus",
      path: "/api/users/me/status",
      request: {
        headers: z.object({
          authorization: z.string().describe("Bearer token for authentication"),
        }),
        body: {
          content: {
            "application/json": {schema: z.object({ status: z.enum(["online", "offline"]) }),},
          },
        },
      },
      responses: {
        200: {
          description: "User status updated",
          content: {
            "application/json": {
              schema: z.object({ userId: z.string(), status: z.enum(["online", "offline"]) }),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden - Cannot update other users" },
      },
      tags: ["users status"],
      summary: "update user's online status",
    }),
    async (c) => {
      try {
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization header is required" }, 401);
        }

        const tokenVerification = verifyToken(authHeader);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }

        const userId = tokenVerification.userId;
        if (tokenVerification.userId !== userId) {
          return c.json({ error: "You can only update your own status" }, 403);
        }

        const body = await c.req.json();
        const parsed = z.object({ status: z.enum(["online", "offline"]) }).safeParse(body);
        if (!parsed.success) {
          return c.json({ error: parsed.error.issues }, 400);
        }
        console.log('userId: ', userId);
        if (!userId) {
          return c.json({ error: "User ID is missing or invalid" }, 400);
        }
        const result = await updateUserStatus(userId, parsed.data.status);
        return c.json(result, 200);
      } catch (error) {
        console.error("Error updating status:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

// 2fa
// POST api/auth/setup-2fa // 設定2FA (生成QR碼) 
// POST api/auth/activate-2fa // 啟用2FA (驗證首次設定)
//  POST api/auth/verify-2fa // 登入時驗證2FA碼

  // setup 2FA  generate qrcode and bind key on google authenticater
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/auth/setup-2fa",
      request: {
        headers: z.object({
          authorization: z.string(),
        }),
      
      },
      responses: {
        200: {
          description: "2FA setup successful",
          content: {
            "application/json": {
              schema: z.object({
                qrCode: z.string(),
                manualEntryKey: z.string(),
              }),
            },
          },
        },
        401: { description: "Unauthorized" },
      },
      tags: ["2FA"],
      summary: "setup 2FA",
    }),
    async (c) => {
      try {
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization required" }, 401);
        }

        const tokenVerification = verifyToken(authHeader);// check jwt token
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }

        const result = await setup2FA(tokenVerification.userId!);
        return c.json(result, 200);
      } catch (error) {
        console.error('Setup 2FA error:', error);
        return c.json({ error: "Failed to setup 2FA" }, 500);
      }
    }
  );


  /*
  curl -X POST http://localhost:4001/api/auth/activate-2fa \
    -H "Authorization: Bearer ey..." \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"......\"}"

  */
 
  // activate 2FA  auth 確認身份用6位數字 確認裝置跟綁定的是否一樣
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/auth/activate-2fa",
      request: {
        headers: z.object({
          authorization: z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: activate2faSchema,
            },
          },
        },
      },
      responses: {
        200: { description: "2FA activated" },
        400: { description: "Invalid code" },
        401: { description: "Unauthorized" },
      },
      tags: ["2FA"],
      summary: "activate 2FA",
    }),
    async (c) => {
      try {
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization required" }, 401);
        }

        const tokenVerification = verifyToken(authHeader);
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }

        const body = await c.req.json();
        const result = activate2faSchema.safeParse(body);
        if (!result.success) {
          return c.json({ error: result.error.issues }, 400);
        }

        await activate2FA(tokenVerification.userId!, result.data.code);
        return c.json({ success: true }, 200);
      } catch (error) {
        console.error('Activate 2FA error:', error);
        if (error instanceof Error && error.message.includes('Invalid')) {
          return c.json({ error: "Invalid 2FA code" }, 400);
        }
        return c.json({ error: "Failed to activate 2FA" }, 500);
      }
    }
  );

  // verify 2FA 確認６位數字跟產生 permanent jwt token 
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/auth/verify-2fa",
      request: {
        body: {
          content: {
            "application/json": {
              schema: verify2faSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "2FA verified",
          content: {
            "application/json": {
              schema: z.object({
                token: z.string(),
                userId: z.string(),
              }),
            },
          },
        },
        400: { description: "Invalid 2fa code" },
      },
      tags: ["2FA"],
      summary: "verify 2FA",
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const result = verify2faSchema.safeParse(body);
        if (!result.success) {
          return c.json({ error: result.error.issues }, 400);
        }

        const verificationResult = await verify2FA(result.data.tempToken, result.data.code);
        return c.json(verificationResult, 200);
      } catch (error) {
        console.error('Verify 2FA error:', error);
        if (error instanceof Error && error.message.includes('Invalid')) {
          return c.json({ error: "Invalid 2FA code" }, 400);
        }
        return c.json({ error: "2FA verification failed" }, 500);
      }
    }
  );

  //friend   取得好友列表
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/friends",
      request: {
        headers: z.object({
          authorization: z.string(),
        }),
      },
      responses: {
        200: {
          description: "List of friends retrieved successfully",
          content:{
            "application/json": {
              schema: z.array(z.object({
                id: z.string(),
                user1: z.string(),
                user2: z.string(),
                
              })),
            },
          },
        },
        400: { description: "Invalid request" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
      tags: ["friends"],
      summary: "get friends list",
    }),
    async (c) => {
      try {
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
          return c.json({ error: "Authorization required" }, 401);
        }

        const tokenVerification = verifyToken(authHeader); 
        if (!tokenVerification.valid) {
          return c.json({ error: tokenVerification.error }, 401);
        }
        const friends = await getFriends(tokenVerification.userId!);
        
        return c.json(friends, 200);
      } catch (error) {
        console.error('Get friends list error:', error);
        return c.json({ error: "Internal server error" }, 500);
      }
      }
    
    
  );


/* test api/friends/request
curl -X POST http://localhost:4001/api/friends/request \
  -H "authorization: Bearer <ey   sender jwt>" \
  -d '{"receiverId":"<receiver ID>"}'
*/

// POST  api/friends/request // 發送好友邀請 
app.openapi(
  createRoute({
    method: "post",
    path: "/api/friends/request/{friendId}/send",
    request: {
      headers: z.object({
        authorization: z.string().describe("Bearer token for authentication"),
      }),
      body: {
        content: {
          "application/json": {
            schema: FriendRequestBodySchema,
          },
        },
      },
      
    },
    responses: {
      201: { 
        description: "friend request sent successfully",
        content: {
          "application/json": {
            schema: FriendResponseSchema,
          }
        }    
      },
      400: { description: "friend request is pending or declined",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            })
          }
        }
       },
      409: {
        description: "Conflict (pair already exists)",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          }
        }
      },
      401: { 
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            })
          }
        }
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          }
        }
      },
    },  
    tags: ["friends"],
    summary: "send friend request",
  }),
  async (c) => {  
    try {
      const authHeader = c.req.header("authorization");
      
      if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid authorization header" }, 401);
      }
      const jwtSecret = 'secret';
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, jwtSecret)as JWTPayload; //
      const senderId = decoded.userId;
      if (!senderId) return c.json({ error: "Invalid token" }, 401);
      const {receiverId} = FriendRequestBodySchema.parse(await c.req.json());
    
      const newFriend=  await createFriendRequest(senderId, receiverId);
      //console.log("✅ Friend request created:", newFriend);
     return c.json(newFriend, 201);
  }catch(err : any){
    console.error("❌ Friend request error:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name
    });
    const msg = err?.message || "friend request failed";
      // 5. 錯誤轉換成 HTTP 狀態碼
      if (msg.includes("yourself")) return c.json({ error: msg }, 400);
      if (msg.includes("already sent")) return c.json({ error: msg }, 400);
      if (msg.includes("friends now")) return c.json({ error: msg }, 400);
      if (msg.includes("declined")) return c.json({ error: msg }, 400);
      if (msg.includes("unauthorized")) return c.json({ error: msg }, 401);
      if (msg.includes("pair") && msg.includes("exists"))
        return c.json({ error: msg }, 409);
      return c.json({ error: "friend request failed" }, 500);
    }  
  }
);

// POST  api/friends/:requestId/accept // 接受好友邀請
app.openapi(
  createRoute({
    method: "post",
    path: "/api/friends/request/{friendId}/accept", // 使用 OpenAPI 標準格式
    request: {
      headers: z.object({
        authorization: z.string().describe("Bearer token for authentication"),
      }),
      params: z.object({
        requestId: z.string().uuid(),
      }),
    },
    responses: {
      200: { // 改成 200，因為這是更新操作
        description: "Friend request accepted successfully",
        content: {
          "application/json": {
            schema: FriendAcceptSchema,
          },
        },
      },
      400: {
        description: "Bad request (e.g. already accepted, not pending, self-accept not allowed)",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      401: {
        description: "Unauthorized (no token provided or invalid)",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      404: {
        description: "Request not found",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
    tags: ["friends"],
    summary: "accept a friend request",
  }),
  async (c) => {
    try {
      const auth = c.req.header("authorization");
      if (!auth?.startsWith("Bearer ")) {
        return c.json({ error: "Authorization header is required" }, 401);
      }

      const jwtSecret = process.env.JWT_SECRET || 'secret'; // 使用環境變數
      const token = auth.replace("Bearer ", "");
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      const userId = decoded.userId;
      
      if (!userId) return c.json({ error: "Invalid token" }, 401);

      const { friendId } = c.req.param();
      
      const updated = await acceptFriendRequest(userId, friendId);
      return c.json(updated, 200); // 與 OpenAPI spec 一致
      
    } catch (err: any) {
      const msg = String(err?.message || "");
      
      // JWT 錯誤處理
      if (err.name === 'JsonWebTokenError') {
        return c.json({ error: "Invalid token signature" }, 401);
      }
      if (err.name === 'TokenExpiredError') {
        return c.json({ error: "Token expired" }, 401);
      }
      
      // 業務邏輯錯誤處理
      if (msg.includes("not found")) return c.json({ error: msg }, 404);
      if (msg.includes("not pending")) return c.json({ error: msg }, 400);
      if (msg.includes("cannot accept")) return c.json({ error: msg }, 400);
      if (msg.toLowerCase().includes("unauthorized")) return c.json({ error: msg }, 401);
      
      console.error("Accept friend request failed:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

// POST  api/friends/:requestId/reject // 拒絕好友邀請 

app.openapi(
  createRoute({
    method: "post",
    path: "/api/friends/request/{friendId}/reject", // 使用 OpenAPI 標準格式
    request: {
      headers: z.object({
        authorization: z.string().describe("Bearer token for authentication"),
      }),
      params: z.object({
        requestId: z.string().uuid(),
      }),
    },
    responses: {
      200: { // 改成 200，因為這是更新操作
        description: "Friend request declined successfully",
        content: {
          "application/json": {
            schema: FriendRejecttSchema,
          },
        },
      },
      400: {
        description: "Bad request ",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      401: {
        description: "Unauthorized (no token provided or invalid)",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      404: {
        description: "Request not found",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
    tags: ["friends"],
    summary: " declined a friend request (if the request was accepted, it cannot be declined)",
  }),
  async (c) => {
    try {
      const auth = c.req.header("authorization");
      if (!auth?.startsWith("Bearer ")) {
        return c.json({ error: "Authorization header is required" }, 401);
      }

      const jwtSecret = process.env.JWT_SECRET || 'secret'; 
      const token = auth.replace("Bearer ", "");
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      const userId = decoded.userId;
      
      if (!userId) return c.json({ error: "Invalid token" }, 401);

      const { friendId } = c.req.param();
      
      const updated = await RejectedFriendRequest(userId, friendId);
      return c.json(updated, 200); 
      
    } catch (err: any) {
      const msg = String(err?.message || "");
      
      // JWT 錯誤處理
      if (err.name === 'JsonWebTokenError') {
        return c.json({ error: "Invalid token signature" }, 401);
      }
      if (err.name === 'TokenExpiredError') {
        return c.json({ error: "Token expired" }, 401);
      }
      
      // 業務邏輯錯誤處理
      if (msg.includes("not found")) return c.json({ error: msg }, 404);
      if (msg.includes("not pending")) return c.json({ error: msg }, 400);
      if (msg.includes("cannot accept")) return c.json({ error: msg }, 400);
      if (msg.toLowerCase().includes("unauthorized")) return c.json({ error: msg }, 401);
      
      console.error("declined friend request failed:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

//GET  api/friends/requests // 取得好友邀請 
app.openapi(
  createRoute({
    method: "get",
    path:  "/api/friends/request/{friendId}/retrieve",
    request:{
      headers: z.object({
        authorization: z.string(),
      }),
    },
    responses: {
      200: { description: "list of pending requests received. ",
        content:{
          "application/json":{
            schema: FriendrequestreceiveSchema,
          }
        }
      },
      401: { description: "unauthorized."},
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
    tags: ["friends"],
    summary: "retrieve pending friend requests"
    }),
  async (c) => {
    try{
      const auth = c.req.header("authorization");
      if (!auth){
        return c.json({ error: "Unauthorized" }, 401);
      }
      const tokenVerification = verifyToken(auth);
      if (!tokenVerification.valid) {
        return c.json({ error: tokenVerification.error }, 401);
      }
      //get userid from auth
      const userId = tokenVerification.userId;
      //找friendid   status 是pending,  我在pair內 || requestid != userid
      const rows = await db
        .selectFrom("friends")
        .selectAll()
        .where("friendstatus", "=", "pending")
        .where((qb)=>
        qb.or([
          qb("user1", "=", userId ?? ""),
          qb("user2", "=", userId ?? ""),
        ])
        )
        .where("requested_by", "<>", userId ?? "")
        .execute();
       return c.json(rows, 200);

    
    } catch(err){ 
      console.error("[friends.requests] error:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

/*
curl -X DELETE http://localhost:4001/api/friends/a33144c7-9368-4e15-b13f-8890c308869c \
  -H "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDQ3NDlmNy04NTEzLTQ0MGItYjFjNy0yNGVmZGQ1NDZmZWIiLCJ1c2VybmFtZSI6Ijc3NyIsImlhdCI6MTc1NzA3NjYxMCwiZXhwIjoxNzU3MjA2MjEwfQ.IV3KBXfBHuCSGP3gQBZneo7mFWiPNoI3zpQHxOgqB6c" \
  -H "Content-Type: application/json"
  */
// DELETE   api/friends/:friendId // 刪除好友 
app.openapi(
  createRoute({
    method: "delete",
    path: "/api/friends/request/{friendId}/delete",
    request: {
      headers:z.object({
        authorization: z.string().describe("Bearer token for authentication"),
      }),
      params: z.object({
        friendId: z.string().uuid(),//uuid type
      }),
    },
    responses: {
      200: { 
        description: "friend request deleted successfully",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean(), message: z.string(), }),
          },
        },
      },
      400: { 
        description: "friendstatus is pending",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
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
        description: "only delete requests you sent",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
      },
      404: { 
        description: "friend request not found",
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
    tags: ["friends"],
    summary: "delete friend request you send (friendstatus = pending)"
  }),
  async(c) => {
    try{
      const authHeader = c.req.header("authorization");
      if (!authHeader) {
        return c.json({ error: "Authorization header is required" }, 401);
      }
      const tokenVerification = verifyToken(authHeader);
      if (!tokenVerification.valid || !tokenVerification.userId)  {
        return c.json({ error: tokenVerification.error || "Invalid token" }, 401);
      }
      const userId = tokenVerification.userId;
      console.log("User ID:", userId);
      const { friendId } = c.req.param();
      console.log("Looking for friendId:", friendId);
      const result = await deletefriendrequest(friendId, userId)
      if (!result){
        return c.json({ error: "friend request not found" }, 404);
      }
      //return c.json(result, 200);
      return c.json(
        { success: true, message: "Friend request deleted successfully." },
        200 as const
      );

    }catch(err){
      console.error("Delete friend request error:", err);
    
      // 根據錯誤訊息回傳適當的狀態碼和訊息
      const errorMessage = (err as any)?.message || "Internal server error";
      
      if (errorMessage.includes("permission")) {
        return c.json({ error: errorMessage }, 403);
      }
      if (errorMessage.includes("pending")) {
        return c.json({ error: errorMessage }, 400);
      }
      if (errorMessage.includes("only delete requests you sent")) {
        return c.json({ error: errorMessage }, 403);
      }
      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

//delete the friend  (when request is declined or accepted)
app.openapi(
  createRoute({
    method: "delete",
    path: "/api/friends/{friendId}/delete",
    request: {
      headers:z.object({
        authorization: z.string().describe("Bearer token for authentication"),
      }),
      params: z.object({
        friendId: z.string().uuid(),//uuid type
      }),
    },
    responses: {
      200: { 
        description: "friend deleted successfully",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean(), message: z.string(), }),
          },
        },
      },
      400: { 
        description: "friendstatus is pending ",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
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
        description: "friend request not found",
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
    tags: ["friends"],
    summary: "delete friend (friendstatus = accepted ot declined)"
  }),
  async(c) => {
    try{
      const authHeader = c.req.header("authorization");
      if (!authHeader) {
        return c.json({ error: "Authorization header is required" }, 401);
      }
      const tokenVerification = verifyToken(authHeader);
      if (!tokenVerification.valid || !tokenVerification.userId)  {
        return c.json({ error: tokenVerification.error || "Invalid token" }, 401);
      }
      const userId = tokenVerification.userId;
      console.log("User ID:", userId);
      const { friendId } = c.req.param();
      console.log("Looking for friendId:", friendId);
      const result = await deletefriend(friendId, userId)
      if (!result){
        return c.json({ error: "friend request not found" }, 404);
      }
      //return c.json(result, 200);
      return c.json(
        { success: true, message: "Friend deleted successfully." },
        200 as const
      );

    }catch(err){
      console.error("Delete friend request error:", err);
    
      // 根據錯誤訊息回傳適當的狀態碼和訊息
      const errorMessage = (err as any)?.message || "Internal server error";
      if (errorMessage.includes("pending")) {
        return c.json({ error: errorMessage }, 400);
      }
      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);


};

export default userRoutes;

/*
responses: {
  400: {
    description: "Bad request",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
  401: {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
  403: {
    description: "Forbidden",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
  404: {
    description: "Not found",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
  500: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
}

*/