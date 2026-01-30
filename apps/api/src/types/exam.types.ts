/**
 * Exam-specific types and DTOs
 */

/**
 * DTO for creating a new exam
 */
export interface CreateExamDTO {
  title: string;
  description?: string;
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
  maxScore: number;
  passingScore: number;
}

/**
 * DTO for updating an existing exam
 */
export interface UpdateExamDTO {
  title?: string;
  description?: string | null;
  durationMinutes?: number;
  startDate?: Date;
  endDate?: Date;
  maxScore?: number;
  passingScore?: number;
}

/**
 * DTO for creating a new exam question
 */
export interface CreateExamQuestionDTO {
  prompt: string;
  type: 'MULTIPLE_CHOICE' | 'TEXT' | 'ESSAY';
  choices?: string[];
  correctIndex?: number;
  explanation?: string;
  points: number;
  order?: number;
}

/**
 * DTO for updating an existing exam question
 */
export interface UpdateExamQuestionDTO {
  prompt?: string;
  type?: 'MULTIPLE_CHOICE' | 'TEXT' | 'ESSAY';
  choices?: string[];
  correctIndex?: number;
  explanation?: string | null;
  points?: number;
  order?: number;
}

/**
 * DTO for submitting an exam attempt
 */
export interface SubmitExamAttemptDTO {
  answers: Record<string, number | string>; // questionId -> answer (index or text)
}

/**
 * DTO for grading an exam attempt
 */
export interface GradeExamAttemptDTO {
  questionScores?: Record<string, number>; // questionId -> score
  finalScore?: number;
  bonus?: number;
}

/**
 * DTO for updating exam attempt score
 */
export interface UpdateExamAttemptScoreDTO {
  bonus?: number;
  finalScore?: number;
}

/**
 * Exam question with parsed choices
 */
export interface ExamQuestionWithParsedChoices {
  id: string;
  prompt: string;
  type: string;
  choices: string[];
  correctIndex: number | null;
  explanation: string | null;
  points: number;
  order: number;
}

/**
 * Exam with relations (includes related data)
 */
export interface ExamWithRelations {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
  maxScore: number;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  course?: {
    id: string;
    title: string;
    description?: string;
    teacherId?: string;
    enrollments?: Array<{
      userId: string;
      status: string;
    }>;
    modules?: Array<{
      id: string;
      lessons: Array<{
        id: string;
      }>;
    }>;
    teacher?: {
      id: string;
      name: string;
    };
  };
  questions?: ExamQuestionWithParsedChoices[];
  attempts?: Array<{
    id: string;
    userId: string;
    score: number | null;
    status: string;
    submittedAt: Date;
  }>;
  _count?: {
    attempts: number;
  };
}

/**
 * Exam attempt with relations
 */
export interface ExamAttemptWithRelations {
  id: string;
  examId: string;
  userId: string;
  answers: string;
  score: number | null;
  status: string;
  submittedAt: Date;
  startedAt: Date;
  // Relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
  exam?: {
    id: string;
    courseId: string;
    maxScore: number;
    questions?: ExamQuestionWithParsedChoices[];
  };
}

/**
 * Exam attempt result with grading information
 */
export interface ExamAttemptResult {
  attempt: ExamAttemptWithRelations;
  score: number | null;
  percentage?: number;
  letterGrade?: string;
  status: string;
  message?: string;
}

/**
 * Course completion status
 */
export interface CourseCompletionStatus {
  allLessonsCompleted: boolean;
  completedLessons: number;
  totalLessons: number;
}
