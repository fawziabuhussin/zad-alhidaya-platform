import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { prisma } from './utils/prisma';

// Routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import coursesRoutes from './routes/courses';
import enrollmentsRoutes from './routes/enrollments';
import progressRoutes from './routes/progress';
import liveSessionsRoutes from './routes/liveSessions';
import quizzesRoutes from './routes/quizzes';
import categoriesRoutes from './routes/categories';
import modulesRoutes from './routes/modules';
import lessonsRoutes from './routes/lessons';
import examsRoutes from './routes/exams';
import homeworkRoutes from './routes/homework';
import gradesRoutes from './routes/grades';
import playlistsRoutes from './routes/playlists';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
const CORS_ORIGIN = FRONTEND_URL;

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes - support both /api/* and /* for Vercel compatibility
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/api/users', usersRoutes);
app.use('/courses', coursesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/progress', progressRoutes);
app.use('/api/progress', progressRoutes);
app.use('/live-sessions', liveSessionsRoutes);
app.use('/api/live-sessions', liveSessionsRoutes);
app.use('/quizzes', quizzesRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/categories', categoriesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/modules', modulesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/lessons', lessonsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/exams', examsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/homework', homeworkRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/grades', gradesRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/playlists', playlistsRoutes);
app.use('/api/playlists', playlistsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;

