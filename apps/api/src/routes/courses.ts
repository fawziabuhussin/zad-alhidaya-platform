/**
 * Course Routes
 * HTTP layer - delegates to CourseManager
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { courseManager } from '../managers/course.manager';
import { createCourseSchema, updateCourseSchema } from '../schemas/course.schema';
import { AuthContext } from '../types/common.types';

const router = express.Router();

/**
 * Helper to extract auth context from request (supports optional auth)
 */
function getAuthContext(req: any): AuthContext | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (token) {
    try {
      const { verifyAccessToken } = require('../utils/jwt');
      const payload = verifyAccessToken(token);
      return { userId: payload.userId, role: payload.role };
    } catch (e) {
      // Invalid token, continue as guest
      return null;
    }
  }
  
  return null;
}

/**
 * GET /admin - Get all courses for admin/teacher (includes DRAFT)
 * Supports pagination: ?page=1&limit=20
 * Without pagination params, returns array (backward compatible)
 */
router.get('/admin', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page, limit } = req.query;

    // If pagination params provided, use paginated version
    if (page || limit) {
      const result = await courseManager.listAdminCourses(
        {
          userId: req.user!.userId,
          role: req.user!.role,
        },
        {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 20,
        }
      );

      if (!result.success) {
        return res.status(result.error!.status).json({ message: result.error!.message });
      }

      return res.json(result.data);
    }

    // Default: unpaginated for backward compatibility
    const result = await courseManager.listAdminCoursesUnpaginated({
      userId: req.user!.userId,
      role: req.user!.role,
    });

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

/**
 * GET / - Get all courses (public/authenticated with filters)
 * Supports pagination: ?page=1&limit=20
 * Without pagination params, returns array (backward compatible)
 */
router.get('/', async (req, res) => {
  try {
    const auth = getAuthContext(req);
    const { categoryId, search, page, limit } = req.query;

    // If pagination params provided, use paginated version
    if (page || limit) {
      const result = await courseManager.listCourses(
        auth,
        {
          categoryId: categoryId as string,
          search: search as string,
        },
        {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 20,
        }
      );

      if (!result.success) {
        return res.status(result.error!.status).json({ message: result.error!.message });
      }

      return res.json(result.data);
    }

    // Default: unpaginated for backward compatibility
    const result = await courseManager.listCoursesUnpaginated(auth, {
      categoryId: categoryId as string,
      search: search as string,
    });

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

/**
 * GET /public - Get all published courses (public)
 * Returns paginated response: { data: [...], pagination: {...} }
 */
router.get('/public', async (req, res) => {
  try {
    const { categoryId, search, page, limit } = req.query;

    const result = await courseManager.listCourses(
      null,
      {
        categoryId: categoryId as string,
        search: search as string,
        status: 'PUBLISHED',
      },
      {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 100, // Default high limit for public listing
      }
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

/**
 * GET /teacher/my-courses - Get my courses (Teacher)
 */
router.get('/teacher/my-courses', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await courseManager.getMyCourses({
      userId: req.user!.userId,
      role: req.user!.role,
    });

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch courses' });
  }
});

/**
 * GET /:id - Get course by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const auth = getAuthContext(req);

    const result = await courseManager.getCourse(auth, id);

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch course:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch course' });
  }
});

/**
 * POST / - Create course (Teacher/Admin)
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createCourseSchema.parse(req.body);

    const result = await courseManager.createCourse(
      { userId: req.user!.userId, role: req.user!.role },
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.status(201).json(result.data);
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
    console.error('Failed to create course:', error);
    res.status(500).json({ message: error.message || 'Failed to create course' });
  }
});

/**
 * PUT /:id - Update course (Teacher of course or Admin)
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateCourseSchema.parse(req.body);

    const result = await courseManager.updateCourse(
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
    console.error('Failed to update course:', error);
    res.status(500).json({ message: error.message || 'Failed to update course' });
  }
});

/**
 * DELETE /:id - Delete course (Teacher of course or Admin)
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await courseManager.deleteCourse(
      { userId: req.user!.userId, role: req.user!.role },
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete course:', error);
    res.status(500).json({ message: error.message || 'Failed to delete course' });
  }
});

export default router;
