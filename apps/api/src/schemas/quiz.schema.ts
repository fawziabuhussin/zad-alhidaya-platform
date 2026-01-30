/**
 * Validation schemas for Quiz
 */
import { z } from 'zod';

/**
 * Schema for a single quiz answer
 */
const quizAnswerSchema = z.object({
  questionId: z.string().uuid('معرف السؤال غير صالح'),
  selectedIndex: z.number().int().min(0, 'الإجابة المختارة غير صالحة'),
});

/**
 * Schema for submitting a quiz attempt
 */
export const submitQuizAttemptSchema = z.object({
  answers: z.array(quizAnswerSchema).min(1, 'يجب تقديم إجابة واحدة على الأقل'),
});

/**
 * Type inference from schemas
 */
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
