/**
 * Validation schemas for Course
 */
import { z } from 'zod';

/**
 * Schema for creating a new course
 */
export const createCourseSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().min(1, 'الوصف مطلوب'),
  coverImage: z.union([z.string().url('رابط الصورة غير صحيح'), z.literal('')]).optional(),
  categoryId: z.string().min(1, 'الفئة غير صحيحة'),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي 0').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  gradingMethod: z.string().optional(), // JSON string
  teacherId: z.string().uuid().optional(), // Only for admin creating course for another teacher
  prerequisiteCourseIds: z.array(z.string().uuid()).optional(),
});

/**
 * Schema for updating an existing course
 */
export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  coverImage: z.union([z.string().url(), z.literal('')]).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  gradingMethod: z.string().optional(), // JSON string
  prerequisiteCourseIds: z.array(z.string().uuid()).optional(),
});

/**
 * Type inference from schemas
 */
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
