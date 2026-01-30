import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createCourseSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().min(1, 'الوصف مطلوب'),
  coverImage: z.union([z.string().url('رابط الصورة غير صحيح'), z.literal('')]).optional(),
  categoryId: z.string().uuid('الفئة غير صحيحة'),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي 0').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  gradingMethod: z.string().optional(), // JSON string
});

// Get all courses (Admin/Teacher - includes DRAFT)
router.get('/admin', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const where: any = {};
    
    // Teachers can only see their own courses, Admins can see all
    if (role === 'TEACHER') {
      where.teacherId = userId;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

// Get all courses (default - returns published courses for public, all for authenticated)
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let userId = null;
    let role = null;
    
    if (token) {
      try {
        const { verifyAccessToken } = require('../utils/jwt');
        const payload = verifyAccessToken(token);
        userId = payload.userId;
        role = payload.role;
      } catch (e) {
        // Invalid token, continue as guest
      }
    }

    const { categoryId, search } = req.query;
    const where: any = {};
    
    // Public users only see published courses
    // Authenticated users see published courses
    // Admin/Teacher see all courses
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      where.status = 'PUBLISHED';
    }

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

// Get all published courses (public)
router.get('/public', async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    const where: any = { status: 'PUBLISHED' };

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

// Get course by ID (public if published, or if user is enrolled/teacher/admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let userId = null;
    
    if (token) {
      try {
        const { verifyAccessToken } = require('../utils/jwt');
        const payload = verifyAccessToken(token);
        userId = payload.userId;
      } catch (e) {
        // Invalid token, continue as guest
      }
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
        modules: {
          include: {
            lessons: {
              include: {
                resources: {
                  orderBy: { order: 'asc' },
                  include: {
                    createdBy: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: userId ? {
          where: { userId },
        } : false,
        exams: {
          orderBy: { startDate: 'asc' },
        },
        homeworks: {
          orderBy: { dueDate: 'asc' },
        },
        resources: {
          orderBy: { order: 'asc' },
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check access
    const isEnrolled = course.enrollments && course.enrollments.length > 0;
    const isTeacher = userId && course.teacherId === userId;
    let isAdmin = false;
    if (token && userId) {
      try {
        const { verifyAccessToken } = require('../utils/jwt');
        const payload = verifyAccessToken(token);
        isAdmin = payload.role === 'ADMIN';
      } catch (e) {
        // Not admin
      }
    }

    if (course.status !== 'PUBLISHED' && !isEnrolled && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Course not accessible' });
    }

    res.json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch course' });
  }
});

// Create course (Teacher/Admin only)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createCourseSchema.parse(req.body);
    const teacherId = req.user!.role === 'ADMIN' && req.body.teacherId
      ? req.body.teacherId
      : req.user!.userId;

    // Clean up coverImage - if empty string, set to null
    const courseData: any = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      teacherId,
      price: data.price || 0,
      status: data.status || 'DRAFT',
    };

    if (data.coverImage && data.coverImage.trim() !== '') {
      courseData.coverImage = data.coverImage;
    }

    if (data.gradingMethod) {
      courseData.gradingMethod = data.gradingMethod;
    }

    const course = await prisma.course.create({
      data: courseData,
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(course);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    res.status(500).json({ message: error.message || 'Failed to create course' });
  }
});

// Update course (Teacher of course or Admin)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).optional(),
      coverImage: z.union([z.string().url(), z.literal('')]).optional(),
      categoryId: z.string().uuid().optional(),
      price: z.number().min(0).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
      gradingMethod: z.string().optional(), // JSON string
    });
    const data = updateSchema.parse(req.body);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const isTeacher = course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Clean up data
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

    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to update course' });
  }
});

// Delete course (Teacher of course or Admin)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const isTeacher = course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete course' });
  }
});

// Get my courses (Teacher)
router.get('/teacher/my-courses', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        teacherId: req.user!.userId,
      },
      include: {
        category: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

export default router;

