/**
 * Validation schemas for Authentication
 */
import { z } from 'zod';

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100, 'كلمة المرور طويلة جداً'),
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
}).refine((data) => data.email || data.username, {
  message: 'Either email or username must be provided',
});

/**
 * Schema for Google OAuth
 */
export const googleAuthSchema = z.object({
  token: z.string().min(1, 'Google token is required'),
});

/**
 * Schema for Apple OAuth
 */
export const appleAuthSchema = z.object({
  identityToken: z.string().min(1, 'Apple identity token is required'),
  user: z.object({
    name: z.string().optional(),
  }).optional(),
});

/**
 * Schema for refresh token request
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

/**
 * Type inference from schemas
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type AppleAuthInput = z.infer<typeof appleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
