/**
 * Enrollment Repository
 * Data access layer for Enrollment-related database operations
 */
import { prisma } from '../utils/prisma';
import { EnrollmentWithRelations, CreateEnrollmentDTO, UpdateEnrollmentDTO } from '../types/enrollment.types';
import { PaginationParams, PaginatedResponse } from '../types/common.types';

/**
 * Include configuration for fetching enrollments with full course details
 */
const enrollmentWithCourseInclude = {
  course: {
    include: {
      category: true,
      teacher: {
        select: { id: true, name: true },
      },
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  },
};

/**
 * Build include config with lesson progress filtered by userId
 */
const getEnrollmentWithProgressInclude = (userId: string) => ({
  course: {
    include: {
      category: true,
      teacher: {
        select: { id: true, name: true },
      },
      modules: {
        include: {
          lessons: {
            include: {
              progress: {
                where: { userId },
                select: { id: true, completedAt: true },
              },
            },
          },
        },
      },
    },
  },
});

/**
 * Include configuration for fetching enrollments with user details
 */
const enrollmentWithUserInclude = {
  user: {
    select: { id: true, name: true, email: true },
  },
};

export class EnrollmentRepository {
  /**
   * Find all enrollments with pagination (admin view)
   */
  async findAll(pagination?: PaginationParams): Promise<PaginatedResponse<EnrollmentWithRelations>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.enrollment.count(),
      prisma.enrollment.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find all enrollments without pagination (admin view - backward compatible)
   */
  async findAllUnpaginated(): Promise<EnrollmentWithRelations[]> {
    return prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    }) as Promise<EnrollmentWithRelations[]>;
  }

  /**
   * Find all enrollments for a user with pagination (includes lesson progress for progress calculation)
   */
  async findByUserId(
    userId: string,
    status?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<EnrollmentWithRelations>> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Pagination defaults
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Execute count and data queries in parallel
    const [total, data] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        include: getEnrollmentWithProgressInclude(userId),
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find all enrollments for a user without pagination (for backward compatibility)
   */
  async findByUserIdUnpaginated(userId: string, status?: string): Promise<EnrollmentWithRelations[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return prisma.enrollment.findMany({
      where,
      include: getEnrollmentWithProgressInclude(userId),
      orderBy: { enrolledAt: 'desc' },
    });
  }

  /**
   * Find all enrollments for a course
   */
  async findByCourseId(courseId: string): Promise<EnrollmentWithRelations[]> {
    return prisma.enrollment.findMany({
      where: { courseId },
      include: enrollmentWithUserInclude,
      orderBy: { enrolledAt: 'desc' },
    });
  }

  /**
   * Find a single enrollment by ID
   */
  async findById(id: string): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.findUnique({
      where: { id },
      include: {
        ...enrollmentWithCourseInclude,
        ...enrollmentWithUserInclude,
      },
    });
  }

  /**
   * Find enrollment by user and course
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: enrollmentWithCourseInclude,
    });
  }

  /**
   * Create a new enrollment
   */
  async create(data: CreateEnrollmentDTO): Promise<EnrollmentWithRelations> {
    return prisma.enrollment.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        status: data.status || 'ACTIVE',
      },
      include: enrollmentWithCourseInclude,
    });
  }

  /**
   * Update an existing enrollment
   */
  async update(id: string, data: UpdateEnrollmentDTO): Promise<EnrollmentWithRelations> {
    return prisma.enrollment.update({
      where: { id },
      data,
      include: enrollmentWithCourseInclude,
    });
  }

  /**
   * Delete an enrollment
   */
  async delete(id: string): Promise<void> {
    await prisma.enrollment.delete({ where: { id } });
  }

  /**
   * Check if enrollment exists
   */
  async exists(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: { id: true },
    });
    return !!enrollment;
  }
}

/**
 * Singleton instance
 */
export const enrollmentRepository = new EnrollmentRepository();
