/**
 * Enrollment Repository
 * Data access layer for Enrollment-related database operations
 */
import { prisma } from '../utils/prisma';
import { EnrollmentWithRelations, CreateEnrollmentDTO, UpdateEnrollmentDTO } from '../types/enrollment.types';

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
 * Include configuration for fetching enrollments with user details
 */
const enrollmentWithUserInclude = {
  user: {
    select: { id: true, name: true, email: true },
  },
};

export class EnrollmentRepository {
  /**
   * Find all enrollments for a user
   */
  async findByUserId(userId: string, status?: string): Promise<EnrollmentWithRelations[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return prisma.enrollment.findMany({
      where,
      include: enrollmentWithCourseInclude,
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
