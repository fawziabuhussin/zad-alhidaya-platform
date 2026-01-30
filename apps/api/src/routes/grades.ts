/**
 * Grade Routes
 * HTTP layer - delegates to GradeManager
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { gradeManager } from '../managers/grade.manager';

const router = express.Router();

/**
 * GET /student/:userId - Get student grades with GPA
 */
router.get('/student/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const result = await gradeManager.getStudentGrades(
      { userId: req.user!.userId, role: req.user!.role },
      userId
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch student grades:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch grades' });
  }
});

/**
 * GET /course/:courseId - Get course grades (teacher/admin only)
 */
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    const result = await gradeManager.getCourseGrades(
      { userId: req.user!.userId, role: req.user!.role },
      courseId
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch course grades:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch grades' });
  }
});

export default router;
