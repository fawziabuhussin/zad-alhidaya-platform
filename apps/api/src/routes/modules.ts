import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createModuleSchema = z.object({
  courseId: z.string().uuid('معرف الدورة غير صحيح'),
  title: z.string().min(1, 'عنوان الوحدة مطلوب').max(200, 'العنوان طويل جداً'),
  order: z.number().int().optional(),
});

// Create module (Teacher/Admin)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createModuleSchema.parse(req.body);
    
    // Validate title is not empty
    if (!data.title || data.title.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: [{ path: ['title'], message: 'عنوان الوحدة مطلوب' }]
      });
    }

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

    // Get max order if not provided
    if (data.order === undefined) {
      const maxOrder = await prisma.module.findFirst({
        where: { courseId: data.courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      data.order = (maxOrder?.order ?? -1) + 1;
    }

    const module = await prisma.module.create({
      data,
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json(module);
  } catch (error: any) {
    console.error('Error creating module:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => ({
          path: e.path,
          message: e.message
        }))
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'الدورة غير موجودة' });
    }
    res.status(500).json({ message: error.message || 'Failed to create module' });
  }
});

// Update module
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createModuleSchema.partial().parse(req.body);

    const module = await prisma.module.findUnique({
      where: { id },
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

    const updated = await prisma.module.update({
      where: { id },
      data,
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update module' });
  }
});

// Delete module
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.module.findUnique({
      where: { id },
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

    await prisma.module.delete({ where: { id } });
    res.json({ message: 'Module deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete module' });
  }
});

export default router;

