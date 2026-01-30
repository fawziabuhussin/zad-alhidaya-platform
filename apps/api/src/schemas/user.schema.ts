/**
 * Validation schemas for User
 */
import { z } from 'zod';

/**
 * Schema for updating an existing user
 */
export const updateUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً').optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], {
    errorMap: () => ({ message: 'الدور غير صالح' })
  }).optional(),
  blocked: z.boolean().optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100, 'كلمة المرور طويلة جداً').optional(),
});

/**
 * Schema for creating a new teacher
 */
export const createTeacherSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100, 'كلمة المرور طويلة جداً'),
});

/**
 * Type inference from schemas
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
