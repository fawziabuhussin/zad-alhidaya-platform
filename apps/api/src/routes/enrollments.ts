/**
 * Enrollment Routes
 * HTTP layer - delegates to EnrollmentManager
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { enrollmentManager } from '../managers/enrollment.manager';
import { createEnrollmentSchema } from '../schemas/enrollment.schema';

const router = express.Router();

/**
 * POST / - Enroll in course (Student/Admin)
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = createEnrollmentSchema.parse(req.body);

    const result = await enrollmentManager.enrollInCourse(
      { userId: req.user!.userId, role: req.user!.role },
      courseId
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
    console.error('Failed to enroll:', error);
    res.status(500).json({ message: error.message || 'Failed to enroll' });
  }
});

/**
 * GET /my-enrollments - Get my enrollments (Student/Admin)
 */
router.get('/my-enrollments', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await enrollmentManager.getMyEnrollments({
      userId: req.user!.userId,
      role: req.user!.role,
    });

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch enrollments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch enrollments' });
  }
});

/**
 * GET /course/:courseId - Get enrollments for a course (Teacher/Admin)
 */
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    const result = await enrollmentManager.getCourseEnrollments(
      { userId: req.user!.userId, role: req.user!.role },
      courseId
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch enrollments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch enrollments' });
  }
});

/**
 * DELETE /:id - Delete/Cancel enrollment
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await enrollmentManager.deleteEnrollment(
      { userId: req.user!.userId, role: req.user!.role },
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete enrollment:', error);
    res.status(500).json({ message: error.message || 'Failed to delete enrollment' });
  }
});

export default router;
