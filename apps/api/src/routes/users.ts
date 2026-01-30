/**
 * User Routes
 * HTTP layer - delegates to UserManager
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { userManager } from '../managers/user.manager';
import { createTeacherSchema, updateUserSchema } from '../schemas/user.schema';

const router = express.Router();

/**
 * GET /users - List all users (Admin only)
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await userManager.listUsers({
      userId: req.user!.userId,
      role: req.user!.role,
    });

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
});

/**
 * POST /users/teachers - Create teacher (Admin only)
 */
router.post('/teachers', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createTeacherSchema.parse(req.body);

    const result = await userManager.createTeacher(
      { userId: req.user!.userId, role: req.user!.role },
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.status(201).json({ message: 'Teacher created successfully', user: result.data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error('Failed to create teacher:', error);
    res.status(500).json({ message: error.message || 'Failed to create teacher' });
  }
});

/**
 * PUT /users/:id - Update user (Admin or self with limited fields)
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const result = await userManager.updateUser(
      { userId: req.user!.userId, role: req.user!.role },
      id,
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error('Failed to update user:', error);
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

/**
 * GET /users/:id/profile - Get user profile (Admin or self)
 */
router.get('/:id/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await userManager.getUserProfile(
      { userId: req.user!.userId, role: req.user!.role },
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch user profile' });
  }
});

/**
 * DELETE /users/:id - Delete user (Admin only)
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await userManager.deleteUser(
      { userId: req.user!.userId, role: req.user!.role },
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
});

export default router;
