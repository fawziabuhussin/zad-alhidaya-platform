/**
 * Course Repository
 * Data access layer for Course-related database operations
 */
import { prisma } from '../utils/prisma';

export class CourseRepository {
  /**
   * Find a course by ID
   * @param id - Course ID
   * @returns Course with id and teacherId, or null if not found
   */
  async findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });
  }

  /**
   * Find the course associated with a lesson
   * @param lessonId - Lesson ID
   * @returns Course with id and teacherId, or null if not found
   */
  async findByLessonId(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: { id: true, teacherId: true },
            },
          },
        },
      },
    });
    return lesson?.module?.course || null;
  }

  /**
   * Check if a user is enrolled in a course
   * @param userId - User ID
   * @param courseId - Course ID
   * @returns true if user is enrolled with ACTIVE status
   */
  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });
    return !!enrollment;
  }
}

/**
 * Singleton instance of CourseRepository
 */
export const courseRepository = new CourseRepository();
