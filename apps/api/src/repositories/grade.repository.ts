/**
 * Grade Repository
 * Data access layer for Grade-related database operations
 */
import { prisma } from '../utils/prisma';
import { GradeWithRelations } from '../types/grade.types';
import { PaginationParams, PaginatedResponse } from '../types/common.types';

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
   * Find all grades for a student with pagination
   */
  async findByUserId(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<GradeWithRelations>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.grade.count({ where: { userId } }),
      prisma.grade.findMany({
        where: { userId },
        include: gradeIncludeForStudent,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data as GradeWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find all grades for a student without pagination (backward compatible)
   */
  async findByUserIdUnpaginated(userId: string): Promise<GradeWithRelations[]> {
    return prisma.grade.findMany({
      where: { userId },
      include: gradeIncludeForStudent,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GradeWithRelations[]>;
  }

  /**
   * Find all grades for a course with pagination
   */
  async findByCourseId(courseId: string, pagination?: PaginationParams): Promise<PaginatedResponse<GradeWithRelations>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.grade.count({ where: { courseId } }),
      prisma.grade.findMany({
        where: { courseId },
        include: gradeIncludeForCourse,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data as GradeWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find all grades for a course without pagination (backward compatible)
   */
  async findByCourseIdUnpaginated(courseId: string): Promise<GradeWithRelations[]> {
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
