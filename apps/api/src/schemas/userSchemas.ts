import { z } from "zod";
import { DatabaseUser } from "../../../../packages/infra/db/index.js";

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


