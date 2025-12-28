import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';
import { z } from 'zod';

const router = express.Router();

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  blocked: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});

const createTeacherSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

// Get all users (Admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        createdAt: true,
        _count: {
          select: {
            coursesTaught: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
});

// Create teacher (Admin only)
router.post('/teachers', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createTeacherSchema.parse(req.body);
    const { name, email, password } = data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create teacher
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'TEACHER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'Teacher created successfully', user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create teacher' });
  }
});

// Update user (Admin only, or self for name/email)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);
    const isAdmin = req.user!.role === 'ADMIN';
    const isSelf = req.user!.userId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Non-admins can only update name and email
    if (!isAdmin && (data.role !== undefined || data.blocked !== undefined || data.password !== undefined)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.blocked !== undefined) updateData.blocked = data.blocked;
    if (data.password !== undefined) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

// Get user profile (Admin can view any user, others can only view themselves)
router.get('/:id/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'ADMIN';
    const isSelf = req.user!.userId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        provider: true,
        createdAt: true,
        _count: {
          select: {
            coursesTaught: true,
            enrollments: true,
            examAttempts: true,
            homeworkSubmissions: true,
            grades: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
          },
          take: 10,
          orderBy: { enrolledAt: 'desc' },
        },
        coursesTaught: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
          take: 10,
        },
        grades: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch user profile' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
});

export default router;

