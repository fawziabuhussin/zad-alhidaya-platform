/**
 * Exam Manager
 * Business logic layer for exam management
 */
import { examRepository } from '../repositories/exam.repository';
import { authorizationService } from '../services/authorization.service';
import { AuthContext } from '../types/common.types';
import {
  CreateExamDTO,
  UpdateExamDTO,
  CreateExamQuestionDTO,
  UpdateExamQuestionDTO,
  SubmitExamAttemptDTO,
  GradeExamAttemptDTO,
  UpdateExamAttemptScoreDTO,
  ExamWithRelations,
  ExamQuestionWithParsedChoices,
  ExamAttemptResult,
} from '../types/exam.types';

/**
 * Result types for manager operations
 */
export interface ExamListResult {
  success: boolean;
  data?: ExamWithRelations[];
  error?: { status: number; message: string };
}

export interface ExamResult {
  success: boolean;
  data?: any;
  error?: { status: number; message: string };
}

export interface QuestionResult {
  success: boolean;
  data?: ExamQuestionWithParsedChoices;
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

export interface AttemptListResult {
  success: boolean;
  data?: any[];
  error?: { status: number; message: string };
}

export interface AttemptResult {
  success: boolean;
  data?: ExamAttemptResult;
  error?: { status: number; message: string };
}

/**
 * Calculate letter grade from percentage
 */
function getLetterGrade(percentage: number): string {
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

export class ExamManager {
  /**
   * List all exams for a course
   */
  async listExams(auth: AuthContext, courseId: string): Promise<ExamListResult> {
    // Check authorization - read access required
    const access = await authorizationService.checkReadAccess(auth, {
      type: 'course',
      id: courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const exams = await examRepository.findByCourseId(courseId, auth.userId);
    return { success: true, data: exams };
  }

  /**
   * Get a single exam with full details
   */
  async getExam(auth: AuthContext, examId: string): Promise<ExamResult> {
    const exam = await examRepository.findById(examId, auth.userId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkReadAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    // Check course completion for students
    let courseCompletionData: any = {};
    if (auth.role === 'STUDENT' && exam.course?.enrollments && exam.course.enrollments.length > 0) {
      const completion = await examRepository.checkCourseCompletion(exam.courseId, auth.userId);
      courseCompletionData = {
        courseCompletionRequired: true,
        allLessonsCompleted: completion.allLessonsCompleted,
        completedLessons: completion.completedLessons,
        totalLessons: completion.totalLessons,
      };
    }

    // Format response with parsed questions
    const response: any = {
      ...exam,
      course: {
        id: exam.course?.id || exam.courseId,
        title: exam.course?.title || '',
      },
      questions: exam.questions || [],
      ...courseCompletionData,
    };

    return { success: true, data: response };
  }

  /**
   * Create a new exam
   */
  async createExam(auth: AuthContext, courseId: string, data: CreateExamDTO): Promise<ExamResult> {
    // Check authorization - write access required
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    // Verify course exists
    const course = await examRepository.getCourseById(courseId);
    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    const exam = await examRepository.create(data, courseId);
    return { success: true, data: exam };
  }

  /**
   * Update an existing exam
   */
  async updateExam(
    auth: AuthContext,
    examId: string,
    data: UpdateExamDTO
  ): Promise<ExamResult> {
    const exam = await examRepository.findById(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    const updatedExam = await examRepository.update(examId, data);
    return { success: true, data: updatedExam };
  }

  /**
   * Delete an exam
   */
  async deleteExam(auth: AuthContext, examId: string): Promise<DeleteResult> {
    const exam = await examRepository.findById(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    await examRepository.delete(examId);
    return { success: true };
  }

  /**
   * Add a question to an exam
   */
  async addQuestion(
    auth: AuthContext,
    examId: string,
    data: CreateExamQuestionDTO,
    allowBonus?: boolean
  ): Promise<QuestionResult> {
    const exam = await examRepository.findExamWithQuestions(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    // Calculate total points
    const currentTotal = exam.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
    const newTotal = currentTotal + data.points;

    // Warn if total exceeds maxScore (but allow it for bonus questions)
    if (newTotal > exam.maxScore && !allowBonus) {
      return {
        success: false,
        error: {
          status: 400,
          message: `Total points (${newTotal}) exceeds max score (${exam.maxScore}). Set allowBonus to true to allow bonus questions.`,
        },
      };
    }

    // Set order if not provided
    if (data.order === undefined) {
      data.order = await examRepository.getNextQuestionOrder(examId);
    }

    const question = await examRepository.createQuestion(data, examId);
    return { success: true, data: question };
  }

  /**
   * Update an exam question
   */
  async updateQuestion(
    auth: AuthContext,
    examId: string,
    questionId: string,
    data: UpdateExamQuestionDTO,
    allowBonus?: boolean
  ): Promise<QuestionResult> {
    const exam = await examRepository.findExamWithQuestions(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Verify question exists
    const currentQuestion = exam.questions?.find((q) => q.id === questionId);
    if (!currentQuestion) {
      return {
        success: false,
        error: { status: 404, message: 'Question not found' },
      };
    }

    // Calculate new total if points changed
    if (data.points !== undefined) {
      const currentTotal = exam.questions?.reduce(
        (sum, q) => sum + (q.id === questionId ? 0 : q.points),
        0
      ) || 0;
      const newTotal = currentTotal + data.points;

      if (newTotal > exam.maxScore && !allowBonus) {
        return {
          success: false,
          error: {
            status: 400,
            message: `Total points (${newTotal}) exceeds max score (${exam.maxScore}). Set allowBonus to true to allow bonus questions.`,
          },
        };
      }
    }

    const question = await examRepository.updateQuestion(questionId, data);
    return { success: true, data: question };
  }

  /**
   * Delete an exam question
   */
  async deleteQuestion(
    auth: AuthContext,
    examId: string,
    questionId: string
  ): Promise<DeleteResult> {
    const exam = await examRepository.findById(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    await examRepository.deleteQuestion(questionId);
    return { success: true };
  }

  /**
   * Get all attempts for an exam (Teacher/Admin only)
   */
  async getExamAttempts(auth: AuthContext, examId: string): Promise<AttemptListResult> {
    const exam = await examRepository.findById(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization - only teachers and admins
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const attempts = await examRepository.findAttemptsByExamId(examId);
    return { success: true, data: attempts };
  }

  /**
   * Submit an exam attempt
   */
  async submitExamAttempt(
    auth: AuthContext,
    examId: string,
    data: SubmitExamAttemptDTO
  ): Promise<AttemptResult> {
    const exam = await examRepository.findById(examId, auth.userId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check if enrolled (for students)
    if (auth.role === 'STUDENT') {
      const isEnrolled = await examRepository.isUserEnrolled(auth.userId, exam.courseId);
      if (!isEnrolled) {
        return {
          success: false,
          error: { status: 403, message: 'Not enrolled in this course' },
        };
      }

      // Check course completion
      const completion = await examRepository.checkCourseCompletion(exam.courseId, auth.userId);
      if (!completion.allLessonsCompleted) {
        return {
          success: false,
          error: {
            status: 403,
            message: 'يجب إكمال جميع دروس الدورة قبل إجراء الامتحان',
          },
        };
      }
    }

    // Check if already attempted
    const existingAttempt = await examRepository.findExistingAttempt(examId, auth.userId);
    if (existingAttempt) {
      return {
        success: false,
        error: { status: 400, message: 'Exam already attempted' },
      };
    }

    // Get questions
    const examWithQuestions = await examRepository.findExamWithQuestions(examId);
    if (!examWithQuestions || !examWithQuestions.questions) {
      return {
        success: false,
        error: { status: 500, message: 'Failed to load exam questions' },
      };
    }

    // Check if exam has open-ended questions
    const hasOpenQuestions = examWithQuestions.questions.some(
      (q) => q.type === 'TEXT' || q.type === 'ESSAY'
    );

    // Calculate score for multiple choice questions
    let score = 0;
    let autoGraded = true;

    examWithQuestions.questions.forEach((question) => {
      if (question.type === 'MULTIPLE_CHOICE') {
        const userAnswer = data.answers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctIndex) {
          score += question.points;
        }
      } else {
        // TEXT or ESSAY questions need manual grading
        autoGraded = false;
      }
    });

    // Determine status
    let status = 'AUTO_GRADED';
    if (hasOpenQuestions) {
      status = 'PENDING'; // Needs manual grading
    }

    // Create attempt
    if (autoGraded) {
      // Fully auto-graded
      score = Math.min(score, exam.maxScore);
      const percentage = (score / exam.maxScore) * 100;
      const letterGrade = getLetterGrade(percentage);

      const attempt = await examRepository.createAttempt(examId, auth.userId, data.answers, score, status);

      // Create grade record
      await examRepository.upsertGrade(
        auth.userId,
        exam.courseId,
        examId,
        score,
        exam.maxScore,
        percentage,
        letterGrade
      );

      return {
        success: true,
        data: {
          attempt,
          score,
          percentage,
          letterGrade,
          status,
        },
      };
    } else {
      // Needs manual grading
      const attempt = await examRepository.createAttempt(examId, auth.userId, data.answers, null, status);

      return {
        success: true,
        data: {
          attempt,
          score: null,
          status,
          message: 'Exam submitted. Awaiting manual grading.',
        },
      };
    }
  }

  /**
   * Grade an exam attempt (for pending attempts with open-ended questions)
   */
  async gradeExamAttempt(
    auth: AuthContext,
    examId: string,
    attemptId: string,
    data: GradeExamAttemptDTO
  ): Promise<AttemptResult> {
    const exam = await examRepository.findExamWithQuestions(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization - only teachers and admins
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const attempt = await examRepository.findAttemptById(attemptId);

    if (!attempt) {
      return {
        success: false,
        error: { status: 404, message: 'Attempt not found' },
      };
    }

    if (attempt.status !== 'PENDING') {
      return {
        success: false,
        error: { status: 400, message: 'This attempt has already been graded' },
      };
    }

    // Calculate score
    let calculatedScore = 0;
    if (data.questionScores && exam.questions) {
      // Calculate from individual question scores
      const answerObj = JSON.parse(attempt.answers);
      exam.questions.forEach((question) => {
        if (question.type === 'MULTIPLE_CHOICE') {
          // Already graded automatically
          const userAnswer = answerObj[question.id];
          if (userAnswer !== undefined && userAnswer === question.correctIndex) {
            calculatedScore += question.points;
          }
        } else {
          // TEXT or ESSAY - use provided score
          const questionScore = data.questionScores![question.id] || 0;
          calculatedScore += Math.min(questionScore, question.points);
        }
      });
    } else if (data.finalScore !== undefined) {
      calculatedScore = data.finalScore;
    } else {
      return {
        success: false,
        error: { status: 400, message: 'Either questionScores or finalScore must be provided' },
      };
    }

    // Add bonus if provided
    const finalScore = Math.min(calculatedScore + (data.bonus || 0), exam.maxScore * 1.5);
    const percentage = (finalScore / exam.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    const updated = await examRepository.updateAttemptScore(attemptId, finalScore, 'GRADED');

    // Update or create grade record
    await examRepository.upsertGrade(
      attempt.userId,
      exam.courseId,
      examId,
      finalScore,
      exam.maxScore,
      percentage,
      letterGrade
    );

    return {
      success: true,
      data: {
        attempt: updated,
        score: finalScore,
        percentage,
        letterGrade,
        status: 'GRADED',
      },
    };
  }

  /**
   * Update exam attempt score with bonus
   */
  async updateExamAttemptScore(
    auth: AuthContext,
    examId: string,
    attemptId: string,
    data: UpdateExamAttemptScoreDTO
  ): Promise<AttemptResult> {
    const exam = await examRepository.findById(examId);

    if (!exam) {
      return {
        success: false,
        error: { status: 404, message: 'Exam not found' },
      };
    }

    // Check authorization - only teachers and admins
    const access = await authorizationService.checkWriteAccess(auth, {
      type: 'course',
      id: exam.courseId,
    });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    const attempt = await examRepository.findAttemptById(attemptId);

    if (!attempt) {
      return {
        success: false,
        error: { status: 404, message: 'Attempt not found' },
      };
    }

    const newScore =
      data.finalScore !== undefined
        ? data.finalScore
        : (attempt.score || 0) + (data.bonus || 0);

    // Don't allow score to exceed maxScore * 1.5
    const finalScore =
      data.finalScore !== undefined
        ? Math.min(data.finalScore, exam.maxScore * 1.5)
        : Math.min(newScore, exam.maxScore * 1.5);

    const percentage = (finalScore / exam.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    const updated = await examRepository.updateAttemptScore(attemptId, finalScore, 'GRADED');

    // Update grade record
    await examRepository.updateGrade(
      attempt.userId,
      exam.courseId,
      examId,
      finalScore,
      percentage,
      letterGrade
    );

    return {
      success: true,
      data: {
        attempt: updated,
        score: finalScore,
        percentage,
        letterGrade,
        status: 'GRADED',
      },
    };
  }
}

/**
 * Singleton instance
 */
export const examManager = new ExamManager();
