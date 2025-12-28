import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createExamSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  maxScore: z.number().default(100),
  passingScore: z.number().default(60),
});

const createQuestionSchema = z.object({
  examId: z.string().uuid(),
  prompt: z.string().min(1),
  type: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'ESSAY']).default('MULTIPLE_CHOICE'),
  choices: z.array(z.string()).min(2).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(), // Explanation for the correct answer
  points: z.number().default(1),
  order: z.number().int().optional(),
}).refine((data) => {
  if (data.type === 'MULTIPLE_CHOICE') {
    return data.choices && data.choices.length >= 2 && data.correctIndex !== undefined;
  }
  return true;
}, {
  message: 'Multiple choice questions require choices and correctIndex',
});

// Get exams for a course
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    // Check enrollment
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

    const exams = await prisma.exam.findMany({
      where: { courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { userId },
        },
        _count: { select: { attempts: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json(exams);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch exams' });
  }
});

// Get exam by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const exam = await prisma.exam.findUnique({
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
        questions: {
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { userId },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isEnrolled = exam.course.enrollments.length > 0;
    const isTeacher = exam.course.teacherId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Parse choices for each question
    const examWithParsedQuestions = {
      ...exam,
      questions: exam.questions.map(q => {
        let choices: string[] = [];
        if (typeof q.choices === 'string') {
          try {
            choices = JSON.parse(q.choices);
          } catch (e) {
            console.error('Failed to parse choices:', e);
            choices = [];
          }
        } else if (Array.isArray(q.choices)) {
          choices = q.choices;
        }
        return {
          id: q.id,
          prompt: q.prompt,
          type: q.type || 'MULTIPLE_CHOICE',
          choices: choices || [],
          correctIndex: q.correctIndex,
          explanation: q.explanation || undefined,
          points: q.points,
          order: q.order,
        };
      }),
    };

    res.json(examWithParsedQuestions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch exam' });
  }
});

// Create exam (Teacher/Admin)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createExamSchema.parse(req.body);

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

    const examData: any = {
      title: data.title,
      durationMinutes: data.durationMinutes,
      courseId: data.courseId,
      startDate: data.startDate,
      endDate: data.endDate,
      maxScore: data.maxScore,
      passingScore: data.passingScore,
    };
    if (data.description) {
      examData.description = data.description;
    }
    const exam = await prisma.exam.create({ data: examData });
    res.status(201).json(exam);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create exam' });
  }
});

// Add question to exam
router.post('/:id/questions', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createQuestionSchema.parse({ ...req.body, examId: id });

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true, questions: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Calculate total points
    const currentTotal = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const newTotal = currentTotal + data.points;

    // Warn if total exceeds maxScore (but allow it for bonus questions)
    if (newTotal > exam.maxScore && !req.body.allowBonus) {
      return res.status(400).json({ 
        message: `Total points (${newTotal}) exceeds max score (${exam.maxScore}). Set allowBonus to true to allow bonus questions.` 
      });
    }

    if (data.order === undefined) {
      const maxOrder = await prisma.examQuestion.findFirst({
        where: { examId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      data.order = (maxOrder?.order ?? -1) + 1;
    }

    const question = await prisma.examQuestion.create({
      data: {
        examId: data.examId,
        prompt: data.prompt,
        type: data.type,
        choices: data.choices ? JSON.stringify(data.choices) : null,
        correctIndex: data.correctIndex,
        explanation: data.explanation || null,
        points: data.points,
        order: data.order,
      },
    });

    res.status(201).json(question);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to add question' });
  }
});

// Update question schema
const updateQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'ESSAY']).optional(),
  choices: z.array(z.string()).min(2).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(), // Explanation for the correct answer
  points: z.number().optional(),
  order: z.number().int().optional(),
}).refine((data) => {
  if (data.type === 'MULTIPLE_CHOICE') {
    return !data.choices || (data.choices.length >= 2 && data.correctIndex !== undefined);
  }
  return true;
}, {
  message: 'Multiple choice questions require choices and correctIndex',
});

// Update question
router.put('/:id/questions/:questionId', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, questionId } = req.params;
    const data = updateQuestionSchema.parse(req.body);

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true, questions: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const currentQuestion = exam.questions.find(q => q.id === questionId);
    if (!currentQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Calculate new total if points changed
    if (data.points !== undefined) {
      const currentTotal = exam.questions.reduce((sum, q) => 
        sum + (q.id === questionId ? 0 : q.points), 0
      );
      const newTotal = currentTotal + data.points;
      
      if (newTotal > exam.maxScore && !req.body.allowBonus) {
        return res.status(400).json({ 
          message: `Total points (${newTotal}) exceeds max score (${exam.maxScore}). Set allowBonus to true to allow bonus questions.` 
        });
      }
    }

    const updated = await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        ...(data.prompt && { prompt: data.prompt }),
        ...(data.type && { type: data.type }),
        ...(data.choices && { choices: JSON.stringify(data.choices) }),
        ...(data.correctIndex !== undefined && { correctIndex: data.correctIndex }),
        ...(data.explanation !== undefined && { explanation: data.explanation || null }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id/questions/:questionId', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, questionId } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.examQuestion.delete({ where: { id: questionId } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete question' });
  }
});

// Get all attempts for an exam (Teacher/Admin)
router.get('/:id/attempts', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id },
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

    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch attempts' });
  }
});

// Get all attempts for an exam (Teacher/Admin)
router.get('/:id/attempts', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id },
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

    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch attempts' });
  }
});

// Grade exam attempt (for PENDING attempts with open-ended questions)
router.post('/:id/attempt/:attemptId/grade', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, attemptId } = req.params;
    const { questionScores, finalScore, bonus } = req.body; // questionScores: {questionId: score}

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { 
        course: true,
        questions: true,
      },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } } },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'PENDING') {
      return res.status(400).json({ message: 'This attempt has already been graded' });
    }

    // Calculate score from question scores or use finalScore
    let calculatedScore = 0;
    if (questionScores) {
      // Calculate from individual question scores
      exam.questions.forEach((question) => {
        if (question.type === 'MULTIPLE_CHOICE') {
          // Already graded automatically
          const answerObj = JSON.parse(attempt.answers);
          const userAnswer = answerObj[question.id];
          if (userAnswer !== undefined && userAnswer === question.correctIndex) {
            calculatedScore += question.points;
          }
        } else {
          // TEXT or ESSAY - use provided score
          const questionScore = questionScores[question.id] || 0;
          calculatedScore += Math.min(questionScore, question.points);
        }
      });
    } else if (finalScore !== undefined) {
      calculatedScore = finalScore;
    } else {
      return res.status(400).json({ message: 'Either questionScores or finalScore must be provided' });
    }

    // Add bonus if provided
    const finalScoreValue = Math.min(calculatedScore + (bonus || 0), exam.maxScore * 1.5);
    const percentage = (finalScoreValue / exam.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { 
        score: finalScoreValue,
        status: 'GRADED',
      },
    });

    // Update or create grade record
    await prisma.grade.upsert({
      where: {
        userId_courseId_type_itemId: {
          userId: attempt.userId,
          courseId: exam.courseId,
          type: 'EXAM',
          itemId: id,
        },
      },
      update: {
        score: finalScoreValue,
        percentage,
        letterGrade,
      },
      create: {
        userId: attempt.userId,
        courseId: exam.courseId,
        type: 'EXAM',
        itemId: id,
        score: finalScoreValue,
        maxScore: exam.maxScore,
        percentage,
        letterGrade,
      },
    });

    res.json({ ...updated, score: finalScoreValue, percentage, letterGrade });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to grade exam attempt' });
  }
});

// Update exam attempt score with bonus
router.patch('/:id/attempt/:attemptId', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, attemptId } = req.params;
    const { bonus, finalScore } = req.body;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isTeacher = exam.course.teacherId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const newScore = finalScore !== undefined ? finalScore : (attempt.score || 0) + (bonus || 0);
    // Don't allow score to exceed maxScore unless explicitly set
    const finalScoreValue = finalScore !== undefined ? Math.min(finalScore, exam.maxScore * 1.5) : Math.min(newScore, exam.maxScore * 1.5);
    const percentage = (finalScoreValue / exam.maxScore) * 100;
    const letterGrade = getLetterGrade(percentage);

    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { 
        score: finalScoreValue,
        status: 'GRADED',
      },
    });

    // Update grade record
    await prisma.grade.updateMany({
      where: {
        userId: attempt.userId,
        courseId: exam.courseId,
        type: 'EXAM',
        itemId: id,
      },
      data: {
        score: finalScoreValue,
        percentage,
        letterGrade,
      },
    });

    res.json({ ...updated, score: finalScoreValue, percentage, letterGrade });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update exam score' });
  }
});

// Submit exam attempt
router.post('/:id/attempt', authenticate, authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const exam = await prisma.exam.findUnique({
      where: { id },
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

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const isEnrolled = exam.course.enrollments.length > 0;
    if (!isEnrolled && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if already attempted
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_userId: {
          examId: id,
          userId: req.user!.userId,
        },
      },
    });

    if (existingAttempt) {
      return res.status(400).json({ message: 'Exam already attempted' });
    }

    // Check if exam has open-ended questions (TEXT or ESSAY)
    const hasOpenQuestions = exam.questions.some(q => q.type === 'TEXT' || q.type === 'ESSAY');
    
    // Calculate score
    let score = 0;
    const answerObj = typeof answers === 'string' ? JSON.parse(answers) : answers;
    let autoGraded = true;

    exam.questions.forEach((question) => {
      if (question.type === 'MULTIPLE_CHOICE') {
        const userAnswer = answerObj[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctIndex) {
          score += question.points;
        }
      } else {
        // TEXT or ESSAY questions need manual grading
        autoGraded = false;
      }
    });

    // Determine status based on question types
    let status = 'AUTO_GRADED';
    if (hasOpenQuestions) {
      status = 'PENDING'; // Needs manual grading
    }

    // If auto-graded, calculate final score
    if (autoGraded) {
      score = Math.min(score, exam.maxScore);
      const percentage = (score / exam.maxScore) * 100;
      const letterGrade = getLetterGrade(percentage);

      const attempt = await prisma.examAttempt.create({
        data: {
          examId: id,
          userId: req.user!.userId,
          answers: JSON.stringify(answerObj),
          score,
          status,
        },
      });

      // Create grade record
      await prisma.grade.create({
        data: {
          userId: req.user!.userId,
          courseId: exam.courseId,
          type: 'EXAM',
          itemId: id,
          score,
          maxScore: exam.maxScore,
          percentage,
          letterGrade,
        },
      });

      return res.json({ attempt, score, percentage, letterGrade, status });
    } else {
      // Manual grading needed - score is 0 for now
      const attempt = await prisma.examAttempt.create({
        data: {
          examId: id,
          userId: req.user!.userId,
          answers: JSON.stringify(answerObj),
          score: null, // Will be set after manual grading
          status,
        },
      });

      return res.json({ attempt, score: null, status, message: 'Exam submitted. Awaiting manual grading.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to submit exam' });
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
