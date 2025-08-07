import { z } from "zod";

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
  userId: z.string(),
  username: z.string(),
  email: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Invalid refresh token'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10, 'Invalid refresh token'),
});

export const verifyEmailSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const enable2FASchema = z.object({
  userId: z.string().min(1),
  totp: z.string().length(6, 'TOTP code must be 6 digits'),
});