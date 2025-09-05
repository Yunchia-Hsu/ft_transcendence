import { z } from "zod";
import type { friends } from "../../../../packages/infra/db/index.js";

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});


export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});


export const userProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  displayname: z.string().nullable(),
});

export const userMeResponseSchema = z.object({
  id: z.string(),
  username: z.string(), 
  displayname: z.string().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string(),
  isEmailVerified: z.boolean(),
  avatar: z.string().nullable(),   
  status: z.string(),
});


export const setup2faSchema = z.object({
});

export const activate2faSchema = z.object({
  code: z.string().length(6, "2fa must contatin 6 digits"),
});

export const verify2faSchema = z.object({
  code: z.string().length(6, "2fa must contatin 6 digits"),
  tempToken: z.string().min(1, "Temp token is required"),
})

export const FriendResponseSchema = z.object({
  friendid: z.string(),
  user1: z.string(),
  user2: z.string(),
  friendstatus: z.enum(["pending", "accepted", "declined", "blocked"]),
  requested_by: z.string(),

}) 

export const FriendAcceptSchema = z.object({
  friendid: z.string(),
  user1: z.string(),
  user2: z.string(),
  friendstatus: z.enum(["pending", "accepted", "declined", "blocked"]),
  requested_by: z.string(),
})
export const FriendRejecttSchema = z.object({
  friendid: z.string(),
  user1: z.string(),
  user2: z.string(),
  friendstatus: z.enum(["pending", "accepted", "declined", "blocked"]),
  requested_by: z.string(),
})


export const FriendRequestBodySchema = z.object({
  receiverId: z.string(),
})

export const  FriendrequestreceiveSchema = z.object({
  friendid: z.string(),
  user1: z.string(),
  user2: z.string(),
  friendstatus: z.enum(["pending", "accepted", "declined", "blocked"]),
  requested_by: z.string(),
});

//export type Freinds = z.infer<typeof FriendResponseschema>;
                      //s.infer 會去 讀取 Zod schema，然後自動生出一個 TypeScript 型別。
