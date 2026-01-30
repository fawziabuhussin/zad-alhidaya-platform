/**
 * Grade Repository
 * Data access layer for Grade-related database operations
 */
import { prisma } from '../utils/prisma';
import { GradeWithRelations } from '../types/grade.types';

/**
 * Include configuration for fetching grades with relations
 */
const gradeIncludeForStudent = {
  course: {
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  },
};

const gradeIncludeForCourse = {
  course: {
    select: {
      id: true,
      title: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

export class GradeRepository {
  /**
   * Find all grades for a student
   */
  async findByUserId(userId: string): Promise<GradeWithRelations[]> {
    return prisma.grade.findMany({
      where: { userId },
      include: gradeIncludeForStudent,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GradeWithRelations[]>;
  }

  /**
   * Find all grades for a course
   */
  async findByCourseId(courseId: string): Promise<GradeWithRelations[]> {
    return prisma.grade.findMany({
      where: { courseId },
      include: gradeIncludeForCourse,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GradeWithRelations[]>;
  }
}

/**
 * Singleton instance
 */
export const gradeRepository = new GradeRepository();
