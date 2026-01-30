/**
 * Course Repository
 * Data access layer for Course-related database operations
 */
import { prisma } from '../utils/prisma';
import { CourseWithRelations, CreateCourseDTO, UpdateCourseDTO, CourseListFilters } from '../types/course.types';

/**
 * Include configuration for fetching courses with full relations
 */
const courseFullInclude = {
  category: true,
  teacher: {
    select: { id: true, name: true, email: true },
  },
  modules: {
    include: {
      lessons: {
        include: {
          resources: {
            orderBy: { order: 'asc' as const },
            include: {
              createdBy: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
  exams: {
    orderBy: { startDate: 'asc' as const },
  },
  homeworks: {
    orderBy: { dueDate: 'asc' as const },
  },
  resources: {
    orderBy: { order: 'asc' as const },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  },
  _count: {
    select: { enrollments: true },
  },
};

/**
 * Include configuration for fetching courses with basic relations
 */
const courseBasicInclude = {
  category: true,
  teacher: {
    select: { id: true, name: true, email: true },
  },
  modules: {
    include: {
      lessons: {
        select: { id: true },
      },
    },
  },
  _count: {
    select: { enrollments: true },
  },
};

export class CourseRepository {
  /**
   * Find a course by ID (for authorization checks)
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
   * Find a course by ID with full relations
   */
  async findByIdWithRelations(id: string, userId?: string): Promise<CourseWithRelations | null> {
    const include: any = { ...courseFullInclude };
    
    // Include enrollments for the specific user if provided
    if (userId) {
      include.enrollments = {
        where: { userId },
      };
    }

    return prisma.course.findUnique({
      where: { id },
      include,
    }) as Promise<CourseWithRelations | null>;
  }

  /**
   * Find all courses with filters
   */
  async findAll(filters: CourseListFilters): Promise<CourseWithRelations[]> {
    const where: any = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.course.findMany({
      where,
      include: courseBasicInclude,
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /**
   * Create a new course
   */
  async create(data: CreateCourseDTO): Promise<CourseWithRelations> {
    const courseData: any = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      teacherId: data.teacherId,
      price: data.price || 0,
      status: data.status || 'DRAFT',
    };

    if (data.coverImage && data.coverImage.trim() !== '') {
      courseData.coverImage = data.coverImage;
    }

    if (data.gradingMethod) {
      courseData.gradingMethod = data.gradingMethod;
    }

    return prisma.course.create({
      data: courseData,
      include: courseBasicInclude,
    }) as any;
  }

  /**
   * Update an existing course
   */
  async update(id: string, data: UpdateCourseDTO): Promise<CourseWithRelations> {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.gradingMethod !== undefined) updateData.gradingMethod = data.gradingMethod;

    if (data.coverImage !== undefined) {
      updateData.coverImage = data.coverImage && data.coverImage.trim() !== '' ? data.coverImage : null;
    }

    return prisma.course.update({
      where: { id },
      data: updateData,
      include: courseBasicInclude,
    }) as any;
  }

  /**
   * Delete a course
   */
  async delete(id: string): Promise<void> {
    await prisma.course.delete({ where: { id } });
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

  /**
   * Check if course exists
   */
  async exists(id: string): Promise<boolean> {
    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!course;
  }
}

/**
 * Singleton instance of CourseRepository
 */
export const courseRepository = new CourseRepository();
