import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get student grades
router.get('/student/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (userId !== currentUserId && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await prisma.grade.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate GPA
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

    const totalPoints = grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.letterGrade] || 0);
    }, 0);

    const gpa = grades.length > 0 ? totalPoints / grades.length : 0;

    res.json({ grades, gpa: gpa.toFixed(2) });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch grades' });
  }
});

// Get course grades
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isTeacher = course.teacherId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await prisma.grade.findMany({
      where: { courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch grades' });
  }
});

export default router;

