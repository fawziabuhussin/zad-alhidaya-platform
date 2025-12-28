import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createHomeworkSchema = z.object({
  courseId: z.string().uuid(),
  moduleId: z.string().uuid().optional().nullable(),
  lessonId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'العنوان مطلوب').max(200),
  description: z.string().min(1, 'الوصف مطلوب'),
  dueDate: z.union([
    z.string().transform(str => new Date(str)),
    z.date()
  ]),
  maxScore: z.number().min(1).default(100),
});

// Get homeworks for a course
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    const isTeacher = course?.teacherId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!enrollment && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const homeworks = await prisma.homework.findMany({
      where: { courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        submissions: {
          where: { userId },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json(homeworks);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch homeworks' });
  }
});

// Get homework by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId, status: 'ACTIVE' },
            },
            teacher: true,
          },
        },
        submissions: {
          where: { userId },
        },
      },
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const isEnrolled = homework.course.enrollments.length > 0;
    const isTeacher = homework.course.teacherId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(homework);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch homework' });
  }
});

// Create homework (Teacher/Admin)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createHomeworkSchema.parse(req.body);

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isTeacher = course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Clean up optional fields
    const homeworkData: any = {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate),
      maxScore: data.maxScore,
    };

    if (data.moduleId) homeworkData.moduleId = data.moduleId;
    if (data.lessonId) homeworkData.lessonId = data.lessonId;

    const homework = await prisma.homework.create({ data: homeworkData });
    res.status(201).json(homework);
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
    res.status(500).json({ message: error.message || 'Failed to create homework' });
  }
});

// Submit homework
router.post('/:id/submit', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, attachments } = req.body;

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                userId: req.user!.userId,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const isEnrolled = homework.course.enrollments.length > 0;
    if (!isEnrolled && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existing = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: id,
          userId: req.user!.userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Homework already submitted' });
    }

    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId: id,
        userId: req.user!.userId,
        content,
        fileUrl: attachments || undefined,
      },
    });

    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to submit homework' });
  }
});

// Get all submissions for a homework (Teacher/Admin)
router.get('/:id/submissions', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const isTeacher = homework.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch submissions' });
  }
});

// Grade homework (Teacher/Admin)
router.post('/:id/grade/:submissionId', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, submissionId } = req.params;
    const { score, feedback } = req.body;

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const isTeacher = homework.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const submission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        gradedAt: new Date(),
      },
      include: { user: true },
    });

    // Create grade record
    const percentage = (score / homework.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    await prisma.grade.create({
      data: {
        userId: submission.userId,
        courseId: homework.courseId,
        type: 'HOMEWORK',
        itemId: id,
        score,
        maxScore: homework.maxScore,
        percentage,
        letterGrade,
      },
    });

    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to grade homework' });
  }
});

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

export default router;

