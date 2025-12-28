import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  type: z.enum(['VIDEO', 'TEXT', 'LIVE', 'PLAYLIST']),
  youtubeUrl: z.union([z.string().url('رابط YouTube غير صحيح'), z.literal('')]).optional(),
  youtubePlaylistId: z.string().optional(),
  textContent: z.string().optional(),
  durationMinutes: z.number().int().min(0, 'المدة يجب أن تكون أكبر من أو تساوي 0').optional(),
  order: z.number().int().optional(),
}).refine((data) => {
  if (data.type === 'VIDEO' || data.type === 'LIVE' || data.type === 'PLAYLIST') {
    return data.youtubeUrl && data.youtubeUrl.trim() !== '';
  }
  if (data.type === 'TEXT') {
    return data.textContent && data.textContent.trim() !== '';
  }
  return true;
}, {
  message: 'يجب إدخال رابط YouTube للمحتوى المرئي أو محتوى نصي للمحتوى النصي',
});

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['VIDEO', 'TEXT', 'LIVE', 'PLAYLIST']).optional(),
  youtubeUrl: z.union([z.string().url(), z.literal('')]).optional(),
  youtubePlaylistId: z.string().optional(),
  textContent: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  order: z.number().int().optional(),
});

// Get lesson by ID (for enrolled students or course teacher/admin)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
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
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check access
    const isEnrolled = lesson.module.course.enrollments.length > 0;
    const isTeacher = lesson.module.course.teacherId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'You must be enrolled in this course' });
    }

    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch lesson' });
  }
});

// Create lesson (Teacher/Admin)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createLessonSchema.parse(req.body);

    // Verify module ownership through course
    const module = await prisma.module.findUnique({
      where: { id: data.moduleId },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const isTeacher = module.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Get max order if not provided
    if (data.order === undefined) {
      const maxOrder = await prisma.lesson.findFirst({
        where: { moduleId: data.moduleId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      data.order = (maxOrder?.order ?? -1) + 1;
    }

    // Clean up data
    const lessonData: any = {
      moduleId: data.moduleId,
      title: data.title,
      type: data.type,
      order: data.order,
    };

    if (data.durationMinutes !== undefined) {
      lessonData.durationMinutes = data.durationMinutes;
    }

    if (data.type === 'VIDEO' || data.type === 'LIVE' || data.type === 'PLAYLIST') {
      if (data.youtubeUrl && data.youtubeUrl.trim() !== '') {
        lessonData.youtubeUrl = data.youtubeUrl.trim();
      }
      if (data.type === 'PLAYLIST' && data.youtubePlaylistId) {
        lessonData.youtubePlaylistId = data.youtubePlaylistId;
      }
    } else if (data.type === 'TEXT') {
      if (data.textContent) {
        lessonData.textContent = data.textContent;
      }
    }

    const lesson = await prisma.lesson.create({ data: lessonData });
    res.status(201).json(lesson);
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
    res.status(500).json({ message: error.message || 'Failed to create lesson' });
  }
});

// Update lesson
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateLessonSchema.parse(req.body);

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const isTeacher = lesson.module.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Clean up data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.order !== undefined) updateData.order = data.order;

    if (data.type === 'VIDEO' || data.type === 'LIVE' || data.type === 'PLAYLIST') {
      if (data.youtubeUrl !== undefined) {
        updateData.youtubeUrl = data.youtubeUrl && data.youtubeUrl.trim() !== '' ? data.youtubeUrl.trim() : null;
      }
      if (data.type === 'PLAYLIST' && data.youtubePlaylistId !== undefined) {
        updateData.youtubePlaylistId = data.youtubePlaylistId;
      }
      // Clear textContent if switching to video type
      if (data.type) {
        updateData.textContent = null;
      }
    } else if (data.type === 'TEXT') {
      if (data.textContent !== undefined) {
        updateData.textContent = data.textContent;
      }
      // Clear youtubeUrl if switching to text type
      if (data.type) {
        updateData.youtubeUrl = null;
        updateData.youtubePlaylistId = null;
      }
    } else {
      // Handle partial updates
      if (data.youtubeUrl !== undefined) {
        updateData.youtubeUrl = data.youtubeUrl && data.youtubeUrl.trim() !== '' ? data.youtubeUrl.trim() : null;
      }
      if (data.textContent !== undefined) {
        updateData.textContent = data.textContent;
      }
      if (data.youtubePlaylistId !== undefined) {
        updateData.youtubePlaylistId = data.youtubePlaylistId;
      }
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
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
    res.status(500).json({ message: error.message || 'Failed to update lesson' });
  }
});

// Delete lesson
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const isTeacher = lesson.module.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.lesson.delete({ where: { id } });
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete lesson' });
  }
});

export default router;
