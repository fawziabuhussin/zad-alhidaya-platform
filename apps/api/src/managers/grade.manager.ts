/**
 * Grade Manager
 * Business logic layer for grade management
 */
import { gradeRepository } from '../repositories/grade.repository';
import { courseRepository } from '../repositories/course.repository';
import { AuthContext } from '../types/common.types';
import { GradeWithRelations, StudentGradesSummary } from '../types/grade.types';

/**
 * Result types for manager operations
 */
export interface StudentGradesResult {
  success: boolean;
  data?: StudentGradesSummary;
  error?: { status: number; message: string };
}

export interface CourseGradesResult {
  success: boolean;
  data?: GradeWithRelations[];
  error?: { status: number; message: string };
}

/**
 * Grade points mapping for GPA calculation
 */
const gradePoints: { [key: string]: number } = {
  'A+': 4.0,
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

export class GradeManager {
  /**
   * Get student grades with GPA calculation
   */
  async getStudentGrades(
    auth: AuthContext,
    userId: string
  ): Promise<StudentGradesResult> {
    // Check authorization: user can only view their own grades, or admin can view any
    const isAdmin = auth.role === 'ADMIN';
    if (userId !== auth.userId && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    // Fetch grades
    const grades = await gradeRepository.findByUserId(userId);

    // Calculate GPA
    const totalPoints = grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.letterGrade] || 0);
    }, 0);

    const gpa = grades.length > 0 ? totalPoints / grades.length : 0;

    return {
      success: true,
      data: {
        grades,
        gpa: gpa.toFixed(2),
      },
    };
  }

  /**
   * Get course grades (teacher/admin only)
   */
  async getCourseGrades(
    auth: AuthContext,
    courseId: string
  ): Promise<CourseGradesResult> {
    // Fetch course to check ownership
    const course = await courseRepository.findById(courseId);

    if (!course) {
      return {
        success: false,
        error: { status: 404, message: 'الدورة غير موجودة' },
      };
    }

    // Check authorization: teacher of the course or admin
    const isTeacher = course.teacherId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    // Fetch grades
    const grades = await gradeRepository.findByCourseId(courseId);

    return {
      success: true,
      data: grades,
    };
  }
}

/**
 * Singleton instance
 */
export const gradeManager = new GradeManager();
