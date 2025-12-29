import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mark lesson as completed
router.post('/lessons/:lessonId/complete', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.userId;

    // Check if lesson exists and user is enrolled
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: {
                    userId,
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check enrollment
    if (req.user!.role !== 'ADMIN' && lesson.module.course.enrollments.length === 0) {
      return res.status(403).json({ message: 'You must be enrolled in this course' });
    }

    // Upsert progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
      },
    });

    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update progress' });
  }
});

// Get progress for a course
router.get('/courses/:courseId', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    // Get all lessons in course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        enrollments: {
          where: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check enrollment
    if (req.user!.role !== 'ADMIN' && course.enrollments.length === 0) {
      return res.status(403).json({ message: 'You must be enrolled in this course' });
    }

    // Get all progress
    const lessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    const progressMap = new Map(progress.map(p => [p.lessonId, p]));

    // Calculate stats
    const totalLessons = lessonIds.length;
    const completedLessons = progress.length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      courseId,
      totalLessons,
      completedLessons,
      percentage,
      progress: progressMap,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch progress' });
  }
});

export default router;




