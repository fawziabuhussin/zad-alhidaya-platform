/**
 * Grade-specific types and DTOs
 * NOTE: Grades are computed on-read from attempt tables
 */

/**
 * Unified grade item (computed from ExamAttempt, HomeworkSubmission, or QuizAttempt)
 */
export interface GradeWithRelations {
  id: string;
  userId: string;
  type: 'EXAM' | 'HOMEWORK' | 'QUIZ';
  itemId: string; // examId, homeworkId, or quizId
  score: number;
  maxScore: number;
  percentage: number;  // Computed: (score/maxScore) * 100
  letterGrade: string; // Computed from percentage
  createdAt: Date;
  updatedAt: Date;
  // Relations
  course?: {
    id: string;
    title: string;
    coverImage?: string | null;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Student grades summary with GPA
 */
export interface StudentGradesSummary {
  grades: GradeWithRelations[];
  gpa: string;
}
