import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Enroll in course (Student)
router.post('/', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.userId,
          courseId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: req.user!.userId,
        courseId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            category: true,
            teacher: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to enroll' });
  }
});

// Get my enrollments (Student)
router.get('/my-enrollments', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: req.user!.userId,
        status: 'ACTIVE',
      },
      include: {
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
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch enrollments' });
  }
});

// Get enrollments for a course (Teacher/Admin)
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const isTeacher = course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch enrollments' });
  }
});

export default router;

