/**
 * Homework Manager
 * Business logic layer for homework management
 */
import { homeworkRepository } from '../repositories/homework.repository';
import { authorizationService } from '../services/authorization.service';
import { AuthContext } from '../types/common.types';
import {
  HomeworkWithRelations,
  HomeworkSubmissionWithRelations,
  CreateHomeworkDTO,
  UpdateHomeworkDTO,
  SubmitHomeworkDTO,
  GradeHomeworkDTO,
} from '../types/homework.types';
import { prisma } from '../utils/prisma';

/**
 * Result types for manager operations
 */
export interface HomeworkListResult {
  success: boolean;
  data?: HomeworkWithRelations[];
  error?: { status: number; message: string };
}

export interface HomeworkResult {
  success: boolean;
  data?: HomeworkWithRelations;
  error?: { status: number; message: string };
}

export interface SubmissionResult {
  success: boolean;
  data?: HomeworkSubmissionWithRelations;
  error?: { status: number; message: string };
}

export interface SubmissionListResult {
  success: boolean;
  data?: HomeworkSubmissionWithRelations[];
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

// Helper function for letter grades
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

export class HomeworkManager {
  /**
   * List all homework for a course
   */
  async listHomework(auth: AuthContext, courseId: string): Promise<HomeworkListResult> {
    // Check authorization
    const access = await authorizationService.checkReadAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'Not enrolled in this course' },
      };
    }

    const homework = await homeworkRepository.findByCourseId(courseId, auth.userId);
    return { success: true, data: homework };
  }

  /**
   * Get a single homework
   */
  async getHomework(auth: AuthContext, courseId: string, homeworkId: string): Promise<HomeworkResult> {
    const homework = await homeworkRepository.findById(homeworkId, auth.userId);

    if (!homework || homework.courseId !== courseId) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    // Check access
    const isEnrolled = homework.course?.enrollments?.some(
      (e) => e.userId === auth.userId && e.status === 'ACTIVE'
    );
    const isTeacher = homework.course?.teacherId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      return {
        success: false,
        error: { status: 403, message: 'Access denied' },
      };
    }

    return { success: true, data: homework };
  }

  /**
   * Create a new homework
   */
  async createHomework(
    auth: AuthContext,
    courseId: string,
    data: CreateHomeworkDTO
  ): Promise<HomeworkResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    const homework = await homeworkRepository.create(data, courseId);
    return { success: true, data: homework };
  }

  /**
   * Update an existing homework
   */
  async updateHomework(
    auth: AuthContext,
    courseId: string,
    homeworkId: string,
    data: UpdateHomeworkDTO
  ): Promise<HomeworkResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Verify homework exists and belongs to course
    const exists = await homeworkRepository.existsInCourse(homeworkId, courseId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    const homework = await homeworkRepository.update(homeworkId, data);
    return { success: true, data: homework };
  }

  /**
   * Delete a homework
   */
  async deleteHomework(
    auth: AuthContext,
    courseId: string,
    homeworkId: string
  ): Promise<DeleteResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    // Verify homework exists and belongs to course
    const exists = await homeworkRepository.existsInCourse(homeworkId, courseId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    await homeworkRepository.delete(homeworkId);
    return { success: true };
  }

  /**
   * Submit homework
   */
  async submitHomework(
    auth: AuthContext,
    homeworkId: string,
    data: SubmitHomeworkDTO
  ): Promise<SubmissionResult> {
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                userId: auth.userId,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!homework) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    const isEnrolled = homework.course.enrollments.length > 0;
    if (!isEnrolled && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'Not enrolled in this course' },
      };
    }

    // Check if already submitted
    const hasSubmitted = await homeworkRepository.hasSubmission(homeworkId, auth.userId);
    if (hasSubmitted) {
      return {
        success: false,
        error: { status: 400, message: 'Homework already submitted' },
      };
    }

    const submission = await homeworkRepository.submitHomework(homeworkId, auth.userId, data);
    return { success: true, data: submission };
  }

  /**
   * Get all submissions for a homework (Teacher/Admin)
   */
  async getSubmissions(
    auth: AuthContext,
    courseId: string,
    homeworkId: string
  ): Promise<SubmissionListResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    // Verify homework exists and belongs to course
    const exists = await homeworkRepository.existsInCourse(homeworkId, courseId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    const submissions = await homeworkRepository.getSubmissions(homeworkId);
    return { success: true, data: submissions };
  }

  /**
   * Grade a homework submission (Teacher/Admin)
   */
  async gradeSubmission(
    auth: AuthContext,
    courseId: string,
    homeworkId: string,
    submissionId: string,
    data: GradeHomeworkDTO
  ): Promise<SubmissionResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });

    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    // Verify homework exists
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework || homework.courseId !== courseId) {
      return {
        success: false,
        error: { status: 404, message: 'Homework not found' },
      };
    }

    // Verify submission exists
    const existingSubmission = await homeworkRepository.getSubmissionById(submissionId);
    if (!existingSubmission || existingSubmission.homeworkId !== homeworkId) {
      return {
        success: false,
        error: { status: 404, message: 'Submission not found' },
      };
    }

    const submission = await homeworkRepository.gradeSubmission(submissionId, data);

    // Create grade record
    const percentage = (data.score / homework.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    await prisma.grade.create({
      data: {
        userId: submission.userId,
        courseId: homework.courseId,
        type: 'HOMEWORK',
        itemId: homeworkId,
        score: data.score,
        maxScore: homework.maxScore,
        percentage,
        letterGrade,
      },
    });

    return { success: true, data: submission };
  }
}

/**
 * Singleton instance
 */
export const homeworkManager = new HomeworkManager();
