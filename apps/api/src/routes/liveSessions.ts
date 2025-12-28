import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createLiveSessionSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime(),
  provider: z.enum(['YOUTUBE', 'FACEBOOK', 'ZOOM', 'MEET', 'OTHER']),
  embedUrl: z.string().url(),
  notes: z.string().optional(),
});

// Get live sessions for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const sessions = await prisma.liveSession.findMany({
      where: { courseId },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch live sessions' });
  }
});

// Create live session (Teacher/Admin)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createLiveSessionSchema.parse(req.body);

    // Verify course ownership
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isTeacher = course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const session = await prisma.liveSession.create({
      data: {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
      },
    });

    res.status(201).json(session);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create live session' });
  }
});

// Update live session
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createLiveSessionSchema.partial().parse(req.body);

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    const isTeacher = session.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updated = await prisma.liveSession.update({
      where: { id },
      data: data.scheduledAt ? { ...data, scheduledAt: new Date(data.scheduledAt) } : data,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update live session' });
  }
});

// Delete live session
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    const isTeacher = session.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.liveSession.delete({ where: { id } });
    res.json({ message: 'Live session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete live session' });
  }
});

export default router;


