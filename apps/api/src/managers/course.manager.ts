/**
 * Course Manager
 * Business logic layer for course management
 */
import { courseRepository } from '../repositories/course.repository';
import { AuthContext } from '../types/common.types';
import { CreateCourseDTO, UpdateCourseDTO, CourseWithRelations, CourseListFilters } from '../types/course.types';

/**
 * Result types for manager operations
 */
export interface CourseListResult {
  success: boolean;
  data?: CourseWithRelations[];
  error?: { status: number; message: string };
}

export interface CourseResult {
  success: boolean;
  data?: CourseWithRelations;
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

export class CourseManager {
  /**
   * List all courses with filters
   * Access rules:
   * - Public/unauthenticated: only PUBLISHED courses
   * - STUDENT: only PUBLISHED courses
   * - TEACHER: their own courses (all statuses)
   * - ADMIN: all courses
   */
  async listCourses(auth: AuthContext | null, filters: CourseListFilters): Promise<CourseListResult> {
    const appliedFilters = { ...filters };

    // Apply status filter based on role
    if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'TEACHER')) {
      appliedFilters.status = 'PUBLISHED';
    }

    // Teachers see only their own courses unless they're also viewing published ones
    if (auth && auth.role === 'TEACHER' && !filters.teacherId) {
      appliedFilters.teacherId = auth.userId;
    }

    const courses = await courseRepository.findAll(appliedFilters);
    return { success: true, data: courses };
  }

  /**
   * Get admin/teacher course list (includes DRAFT courses)
   */
  async listAdminCourses(auth: AuthContext): Promise<CourseListResult> {
    // Check authorization
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const filters: CourseListFilters = {};
    
    // Teachers can only see their own courses
    if (auth.role === 'TEACHER') {
      filters.teacherId = auth.userId;
    }

    const courses = await courseRepository.findAll(filters);
    return { success: true, data: courses };
  }

  /**
   * Get a single course by ID
   * Access rules:
   * - PUBLISHED courses: accessible by everyone
   * - DRAFT courses: accessible only by teacher, admin, or enrolled students
   */
  async getCourse(auth: AuthContext | null, courseId: string): Promise<CourseResult> {
    const course = await courseRepository.findByIdWithRelations(courseId, auth?.userId);

    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    // Check access based on course status
    if (course.status !== 'PUBLISHED') {
      // For draft courses, check if user has access
      if (!auth) {
        return {
          success: false,
          error: { status: 403, message: 'Course not accessible' },
        };
      }

      const isTeacher = course.teacherId === auth.userId;
      const isAdmin = auth.role === 'ADMIN';
      const isEnrolled = course.enrollments && course.enrollments.length > 0;

      if (!isTeacher && !isAdmin && !isEnrolled) {
        return {
          success: false,
          error: { status: 403, message: 'Course not accessible' },
        };
      }
    }

    return { success: true, data: course };
  }

  /**
   * Create a new course (Teacher or Admin)
   */
  async createCourse(auth: AuthContext, data: Omit<CreateCourseDTO, 'teacherId'> & { teacherId?: string }): Promise<CourseResult> {
    // Check authorization
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    // Determine teacherId
    // Admin can specify a teacherId, otherwise use their own
    const teacherId = auth.role === 'ADMIN' && data.teacherId
      ? data.teacherId
      : auth.userId;

    const courseData: CreateCourseDTO = {
      ...data,
      teacherId,
    };

    const course = await courseRepository.create(courseData);
    return { success: true, data: course };
  }

  /**
   * Update an existing course (Teacher of course or Admin)
   */
  async updateCourse(
    auth: AuthContext,
    courseId: string,
    data: UpdateCourseDTO
  ): Promise<CourseResult> {
    // Check if course exists
    const course = await courseRepository.findById(courseId);
    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    // Check permissions
    const isTeacher = course.teacherId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    const updated = await courseRepository.update(courseId, data);
    return { success: true, data: updated };
  }

  /**
   * Delete a course (Teacher of course or Admin)
   */
  async deleteCourse(auth: AuthContext, courseId: string): Promise<DeleteResult> {
    // Check if course exists
    const course = await courseRepository.findById(courseId);
    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'Course not found' },
      };
    }

    // Check permissions
    const isTeacher = course.teacherId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    await courseRepository.delete(courseId);
    return { success: true };
  }

  /**
   * Get my courses (Teacher)
   */
  async getMyCourses(auth: AuthContext): Promise<CourseListResult> {
    // Check authorization
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const courses = await courseRepository.findAll({ teacherId: auth.userId });
    return { success: true, data: courses };
  }
}

/**
 * Singleton instance
 */
export const courseManager = new CourseManager();
