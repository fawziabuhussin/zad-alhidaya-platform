/**
 * Enrollment Manager
 * Business logic layer for enrollment management
 */
import { enrollmentRepository } from '../repositories/enrollment.repository';
import { courseRepository } from '../repositories/course.repository';
import { AuthContext } from '../types/common.types';
import { EnrollmentWithRelations } from '../types/enrollment.types';
import { prisma } from '../utils/prisma';

/**
 * Result types for manager operations
 */
export interface EnrollmentListResult {
  success: boolean;
  data?: EnrollmentWithRelations[];
  error?: { status: number; message: string };
}

export interface EnrollmentResult {
  success: boolean;
  data?: EnrollmentWithRelations;
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

export class EnrollmentManager {
  /**
   * Enroll in a course (Student or Admin)
   */
  async enrollInCourse(auth: AuthContext, courseId: string): Promise<EnrollmentResult> {
    // Check authorization - only STUDENT and ADMIN can enroll
    if (auth.role !== 'STUDENT' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتسجيل' },
      };
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    if (course.status !== 'PUBLISHED') {
      return {
        success: false,
        error: { status: 400, message: 'Course is not available for enrollment' },
      };
    }

    type CoursePrerequisiteWithCourse = {
      prerequisite: { id: string; title: string };
    };

    const prerequisites = (await (prisma as any).coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisite: {
          select: { id: true, title: true },
        },
      },
    })) as CoursePrerequisiteWithCourse[];

    if (prerequisites.length > 0) {
      const prerequisiteIds = prerequisites.map((prereq) => prereq.prerequisite.id);
      const grades = await prisma.grade.findMany({
        where: {
          userId: auth.userId,
          courseId: { in: prerequisiteIds },
          type: 'FINAL',
        },
        select: { courseId: true, percentage: true },
      });

      const passedCourses = new Set(
        grades.filter((grade) => grade.percentage >= 60).map((grade) => grade.courseId)
      );
      const missing = prerequisites.filter(
        (prereq) => !passedCourses.has(prereq.prerequisite.id)
      );

      if (missing.length > 0) {
        const titles = missing.map((prereq) => prereq.prerequisite.title).join('، ');
        return {
          success: false,
          error: {
            status: 400,
            message: `يجب إكمال المساقات السابقة والنجاح بدرجة 60 على الأقل قبل التسجيل: ${titles}`,
          },
        };
      }
    }

    // Check if already enrolled
    const existing = await enrollmentRepository.exists(auth.userId, courseId);
    if (existing) {
      return {
        success: false,
        error: { status: 400, message: 'Already enrolled in this course' },
      };
    }

    // Create enrollment
    const enrollment = await enrollmentRepository.create({
      userId: auth.userId,
      courseId,
      status: 'ACTIVE',
    });

    return { success: true, data: enrollment };
  }

  /**
   * Get my enrollments (Student or Admin)
   */
  async getMyEnrollments(auth: AuthContext): Promise<EnrollmentListResult> {
    // Check authorization - only STUDENT and ADMIN can view their enrollments
    if (auth.role !== 'STUDENT' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const enrollments = await enrollmentRepository.findByUserId(auth.userId, 'ACTIVE');
    return { success: true, data: enrollments };
  }

  /**
   * Get enrollments for a course (Teacher or Admin)
   */
  async getCourseEnrollments(auth: AuthContext, courseId: string): Promise<EnrollmentListResult> {
    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    // Check permissions - must be teacher of course or admin
    const isTeacher = course.teacherId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const enrollments = await enrollmentRepository.findByCourseId(courseId);
    return { success: true, data: enrollments };
  }

  /**
   * Update enrollment status (Admin only)
   */
  async updateEnrollment(
    auth: AuthContext,
    enrollmentId: string,
    status: string
  ): Promise<EnrollmentResult> {
    // Check authorization - only ADMIN can update enrollment status
    if (auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Verify enrollment exists
    const enrollment = await enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      return {
        success: false,
        error: { status: 404, message: 'Enrollment not found' },
      };
    }

    const updated = await enrollmentRepository.update(enrollmentId, { status });
    return { success: true, data: updated };
  }

  /**
   * Delete/Cancel enrollment (Student can cancel their own, Admin can delete any)
   */
  async deleteEnrollment(auth: AuthContext, enrollmentId: string): Promise<DeleteResult> {
    // Verify enrollment exists
    const enrollment = await enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      return {
        success: false,
        error: { status: 404, message: 'Enrollment not found' },
      };
    }

    // Check permissions - must be the enrolled user or admin
    const isOwner = enrollment.userId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    await enrollmentRepository.delete(enrollmentId);
    return { success: true };
  }
}

/**
 * Singleton instance
 */
export const enrollmentManager = new EnrollmentManager();
