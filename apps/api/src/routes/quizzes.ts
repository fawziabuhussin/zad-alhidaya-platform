import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get quizzes for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quizzes);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch quizzes' });
  }
});

// Submit quiz attempt
router.post('/:quizId/attempt', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedIndex }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
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

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check enrollment
    if (req.user!.role !== 'ADMIN' && quiz.course.enrollments.length === 0) {
      return res.status(403).json({ message: 'You must be enrolled in this course' });
    }

    // Calculate score
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      const answer = answers.find((a: any) => a.questionId === q.id);
      if (answer && answer.selectedIndex === q.correctIndex) {
        correct++;
      }
    });

    const score = (correct / quiz.questions.length) * 100;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: req.user!.userId,
        quizId,
        score,
      },
    });

    res.json({ ...attempt, correct, total: quiz.questions.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to submit quiz' });
  }
});

export default router;


