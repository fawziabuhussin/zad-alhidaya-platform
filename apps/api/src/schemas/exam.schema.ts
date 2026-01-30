/**
 * Validation schemas for Exam
 */
import { z } from 'zod';

/**
 * Schema for creating a new exam
 */
export const createExamSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(1, 'مدة الامتحان يجب أن تكون أكثر من 0 دقيقة'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  maxScore: z.number().default(100),
  passingScore: z.number().default(60),
});

/**
 * Schema for updating an existing exam
 */
export const updateExamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(1).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
});

/**
 * Schema for creating a new exam question
 */
export const createExamQuestionSchema = z.object({
  examId: z.string().uuid(),
  prompt: z.string().min(1, 'السؤال مطلوب'),
  type: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'ESSAY']).default('MULTIPLE_CHOICE'),
  choices: z.array(z.string()).min(2, 'يجب أن يكون هناك خياران على الأقل').optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
  points: z.number().default(1),
  order: z.number().int().optional(),
}).refine((data) => {
  if (data.type === 'MULTIPLE_CHOICE') {
    return data.choices && data.choices.length >= 2 && data.correctIndex !== undefined;
  }
  return true;
}, {
  message: 'الأسئلة متعددة الخيارات تتطلب خيارات والإجابة الصحيحة',
});

/**
 * Schema for updating an existing exam question
 */
export const updateExamQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'ESSAY']).optional(),
  choices: z.array(z.string()).min(2).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
  points: z.number().optional(),
  order: z.number().int().optional(),
}).refine((data) => {
  if (data.type === 'MULTIPLE_CHOICE') {
    return !data.choices || (data.choices.length >= 2 && data.correctIndex !== undefined);
  }
  return true;
}, {
  message: 'الأسئلة متعددة الخيارات تتطلب خيارات والإجابة الصحيحة',
});

/**
 * Schema for submitting an exam attempt
 */
export const submitExamAttemptSchema = z.object({
  answers: z.record(z.union([z.number(), z.string()])),
});

/**
 * Schema for grading an exam attempt
 */
export const gradeExamAttemptSchema = z.object({
  questionScores: z.record(z.number()).optional(),
  finalScore: z.number().optional(),
  bonus: z.number().optional(),
}).refine((data) => {
  return data.questionScores !== undefined || data.finalScore !== undefined;
}, {
  message: 'Either questionScores or finalScore must be provided',
});

/**
 * Schema for updating exam attempt score with bonus
 */
export const updateExamAttemptScoreSchema = z.object({
  bonus: z.number().optional(),
  finalScore: z.number().optional(),
});

/**
 * Type inference from schemas
 */
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type CreateExamQuestionInput = z.infer<typeof createExamQuestionSchema>;
export type UpdateExamQuestionInput = z.infer<typeof updateExamQuestionSchema>;
export type SubmitExamAttemptInput = z.infer<typeof submitExamAttemptSchema>;
export type GradeExamAttemptInput = z.infer<typeof gradeExamAttemptSchema>;
export type UpdateExamAttemptScoreInput = z.infer<typeof updateExamAttemptScoreSchema>;
