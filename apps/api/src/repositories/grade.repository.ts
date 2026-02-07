/**
 * Grade Repository
 * Data access layer - computes grades from attempt/submission tables
 */
import { prisma } from '../utils/prisma';
import { GradeWithRelations } from '../types/grade.types';
import { PaginationParams, PaginatedResponse } from '../types/common.types';
import { calculatePercentage, getLetterGrade } from '../utils/grade-helpers';

export class GradeRepository {
  /**
   * Find all grades for a student with pagination (computed from attempts)
   */
  async findByUserId(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<GradeWithRelations>> {
    // Query all three sources in parallel
    const [examAttempts, homeworkSubmissions, quizAttempts] = await Promise.all([
      prisma.examAttempt.findMany({
        where: { userId, score: { not: null } },
        include: {
          exam: {
            select: {
              id: true,
              maxScore: true,
              title: true,
              course: { select: { id: true, title: true, coverImage: true } }
            }
          }
        }
      }),
      prisma.homeworkSubmission.findMany({
        where: { userId, score: { not: null } },
        include: {
          homework: {
            select: {
              id: true,
              maxScore: true,
              title: true,
              course: { select: { id: true, title: true, coverImage: true } }
            }
          }
        }
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, title: true, coverImage: true } },
              _count: { select: { questions: true } }
            }
          }
        }
      })
    ]);

    // Transform to unified format with computed fields
    const allGrades: GradeWithRelations[] = [
      ...examAttempts.map(a => {
        const percentage = calculatePercentage(a.score, a.exam.maxScore)!;
        return {
          id: a.id,
          userId: a.userId,
          type: 'EXAM' as const,
          itemId: a.examId,
          score: a.score!,
          maxScore: a.exam.maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: a.submittedAt,
          updatedAt: a.submittedAt,
          course: a.exam.course
        };
      }),
      ...homeworkSubmissions.map(h => {
        const percentage = calculatePercentage(h.score, h.homework.maxScore)!;
        return {
          id: h.id,
          userId: h.userId,
          type: 'HOMEWORK' as const,
          itemId: h.homeworkId,
          score: h.score!,
          maxScore: h.homework.maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: h.submittedAt,
          updatedAt: h.gradedAt || h.submittedAt,
          course: h.homework.course
        };
      }),
      ...quizAttempts.map(q => {
        const maxScore = q.quiz._count?.questions || 10;
        const percentage = calculatePercentage(q.score, maxScore)!;
        return {
          id: q.id,
          userId: q.userId,
          type: 'QUIZ' as const,
          itemId: q.quizId,
          score: q.score,
          maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: q.submittedAt,
          updatedAt: q.submittedAt,
          course: q.quiz.course
        };
      })
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;
    const paginatedData = allGrades.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: allGrades.length,
        totalPages: Math.ceil(allGrades.length / limit),
      },
    };
  }

  /**
   * Find all grades for a student without pagination (backward compatible)
   */
  async findByUserIdUnpaginated(userId: string): Promise<GradeWithRelations[]> {
    const result = await this.findByUserId(userId, { page: 1, limit: 1000 });
    return result.data;
  }

  /**
   * Find all grades for a course with pagination (computed from attempts)
   */
  async findByCourseId(courseId: string, pagination?: PaginationParams): Promise<PaginatedResponse<GradeWithRelations>> {
    const [examAttempts, homeworkSubmissions, quizAttempts] = await Promise.all([
      prisma.examAttempt.findMany({
        where: { score: { not: null }, exam: { courseId } },
        include: {
          exam: {
            select: { id: true, maxScore: true, title: true, course: { select: { id: true, title: true } } }
          },
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.homeworkSubmission.findMany({
        where: { score: { not: null }, homework: { courseId } },
        include: {
          homework: {
            select: { id: true, maxScore: true, title: true, course: { select: { id: true, title: true } } }
          },
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.quizAttempt.findMany({
        where: { quiz: { courseId } },
        include: {
          quiz: {
            select: { id: true, title: true, course: { select: { id: true, title: true } }, _count: { select: { questions: true } } }
          },
          user: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    const allGrades: GradeWithRelations[] = [
      ...examAttempts.map(a => {
        const percentage = calculatePercentage(a.score, a.exam.maxScore)!;
        return {
          id: a.id,
          userId: a.userId,
          type: 'EXAM' as const,
          itemId: a.examId,
          score: a.score!,
          maxScore: a.exam.maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: a.submittedAt,
          updatedAt: a.submittedAt,
          course: a.exam.course,
          user: a.user
        };
      }),
      ...homeworkSubmissions.map(h => {
        const percentage = calculatePercentage(h.score, h.homework.maxScore)!;
        return {
          id: h.id,
          userId: h.userId,
          type: 'HOMEWORK' as const,
          itemId: h.homeworkId,
          score: h.score!,
          maxScore: h.homework.maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: h.submittedAt,
          updatedAt: h.gradedAt || h.submittedAt,
          course: h.homework.course,
          user: h.user
        };
      }),
      ...quizAttempts.map(q => {
        const maxScore = q.quiz._count?.questions || 10;
        const percentage = calculatePercentage(q.score, maxScore)!;
        return {
          id: q.id,
          userId: q.userId,
          type: 'QUIZ' as const,
          itemId: q.quizId,
          score: q.score,
          maxScore,
          percentage,
          letterGrade: getLetterGrade(percentage)!,
          createdAt: q.submittedAt,
          updatedAt: q.submittedAt,
          course: q.quiz.course,
          user: q.user
        };
      })
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;
    const paginatedData = allGrades.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: allGrades.length,
        totalPages: Math.ceil(allGrades.length / limit),
      },
    };
  }

  /**
   * Find all grades for a course without pagination (backward compatible)
   */
  async findByCourseIdUnpaginated(courseId: string): Promise<GradeWithRelations[]> {
    const result = await this.findByCourseId(courseId, { page: 1, limit: 1000 });
    return result.data;
  }
}

/**
 * Singleton instance
 */
export const gradeRepository = new GradeRepository();
