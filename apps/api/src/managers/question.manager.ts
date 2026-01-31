/**
 * Question Manager - Business logic for lesson questions
 */
import { questionRepository } from '../repositories/question.repository';
import { enrollmentRepository } from '../repositories/enrollment.repository';
import { lessonRepository } from '../repositories/lesson.repository';
import { CreateQuestionDTO, AnswerQuestionDTO, QuestionFilters } from '../types/question.types';
import { AuthContext } from '../types/common.types';

export const questionManager = {
  /**
   * Create a new question
   */
  async createQuestion(
    auth: AuthContext,
    data: CreateQuestionDTO
  ) {
    // Only students can ask questions
    if (auth.role !== 'STUDENT') {
      return {
        success: false,
        error: { status: 403, message: 'فقط الطلاب يمكنهم طرح الأسئلة' },
      };
    }

    // Verify the lesson exists and belongs to the course
    const lesson = await lessonRepository.findById(data.lessonId);
    if (!lesson) {
      return {
        success: false,
        error: { status: 404, message: 'الدرس غير موجود' },
      };
    }

    // Get the course ID from the lesson's module
    const lessonCourseId = lesson.module?.course?.id;
    if (lessonCourseId !== data.courseId) {
      return {
        success: false,
        error: { status: 400, message: 'الدرس لا ينتمي لهذه الدورة' },
      };
    }

    // Check if user is enrolled in the course
    const enrollments = await enrollmentRepository.findByUserId(auth.userId);
    const isEnrolled = enrollments.some(
      (e) => e.courseId === data.courseId && e.status === 'ACTIVE'
    );

    if (!isEnrolled) {
      return {
        success: false,
        error: { status: 403, message: 'يجب أن تكون مسجلاً في الدورة لطرح سؤال' },
      };
    }

    const question = await questionRepository.create({
      studentId: auth.userId,
      courseId: data.courseId,
      lessonId: data.lessonId,
      question: data.question,
    });

    return { success: true, data: question };
  },

  /**
   * Get all questions (admin only)
   */
  async getAllQuestions(
    auth: AuthContext,
    filters: QuestionFilters = {}
  ) {
    if (auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مصرح لك بالوصول' },
      };
    }

    const questions = await questionRepository.findAll(filters);
    return { success: true, data: questions };
  },

  /**
   * Get questions for the logged-in student
   */
  async getMyQuestions(auth: AuthContext) {
    if (auth.role !== 'STUDENT') {
      return {
        success: false,
        error: { status: 403, message: 'غير مصرح لك بالوصول' },
      };
    }

    const questions = await questionRepository.findByStudent(auth.userId);
    return { success: true, data: questions };
  },

  /**
   * Get questions for courses taught by the teacher
   */
  async getTeacherQuestions(
    auth: AuthContext,
    filters: QuestionFilters = {}
  ) {
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مصرح لك بالوصول' },
      };
    }

    // Admin sees all, teacher sees their own
    if (auth.role === 'ADMIN') {
      const questions = await questionRepository.findAll(filters);
      return { success: true, data: questions };
    }

    const questions = await questionRepository.findByTeacher(auth.userId, filters);
    return { success: true, data: questions };
  },

  /**
   * Get count of new questions (for notifications)
   */
  async getNewQuestionsCount(auth: AuthContext) {
    if (auth.role === 'ADMIN') {
      const count = await questionRepository.countNew();
      return { success: true, data: { count } };
    }

    if (auth.role === 'TEACHER') {
      const count = await questionRepository.countNew(auth.userId);
      return { success: true, data: { count } };
    }

    return { success: true, data: { count: 0 } };
  },

  /**
   * Answer a question
   */
  async answerQuestion(
    auth: AuthContext,
    questionId: string,
    data: AnswerQuestionDTO
  ) {
    const question = await questionRepository.findById(questionId);

    if (!question) {
      return {
        success: false,
        error: { status: 404, message: 'السؤال غير موجود' },
      };
    }

    // Check if already answered
    if (question.status === 'ANSWERED') {
      return {
        success: false,
        error: { status: 400, message: 'تم الإجابة على هذا السؤال مسبقاً' },
      };
    }

    // Check authorization: Admin or course teacher
    const isAdmin = auth.role === 'ADMIN';
    const isCourseTeacher = auth.role === 'TEACHER' && question.course.teacherId === auth.userId;

    if (!isAdmin && !isCourseTeacher) {
      return {
        success: false,
        error: { status: 403, message: 'غير مصرح لك بالإجابة على هذا السؤال' },
      };
    }

    const updatedQuestion = await questionRepository.answer(questionId, {
      answer: data.answer,
      answeredById: auth.userId,
    });

    return { success: true, data: updatedQuestion };
  },

  /**
   * Delete a question
   */
  async deleteQuestion(
    auth: AuthContext,
    questionId: string
  ) {
    const question = await questionRepository.findById(questionId);

    if (!question) {
      return {
        success: false,
        error: { status: 404, message: 'السؤال غير موجود' },
      };
    }

    // Check authorization: Admin, course teacher, or the student who asked
    const isAdmin = auth.role === 'ADMIN';
    const isCourseTeacher = auth.role === 'TEACHER' && question.course.teacherId === auth.userId;
    const isOwner = question.student.id === auth.userId;

    if (!isAdmin && !isCourseTeacher && !isOwner) {
      return {
        success: false,
        error: { status: 403, message: 'غير مصرح لك بحذف هذا السؤال' },
      };
    }

    await questionRepository.delete(questionId);
    return { success: true };
  },
};
