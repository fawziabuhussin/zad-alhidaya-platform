/**
 * Validation schemas for Grade
 */
import { z } from 'zod';

/**
 * Schema for validating userId parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('معرف المستخدم غير صالح'),
});

/**
 * Schema for validating courseId parameter
 */
export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('معرف الدورة غير صالح'),
});

/**
 * Type inference from schemas
 */
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
