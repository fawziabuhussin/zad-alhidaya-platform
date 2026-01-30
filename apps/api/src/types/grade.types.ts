/**
 * Grade-specific types and DTOs
 */

/**
 * Grade with relations (includes related data)
 */
export interface GradeWithRelations {
  id: string;
  userId: string;
  courseId: string;
  type: string; // EXAM, HOMEWORK, QUIZ, FINAL
  itemId: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string; // A+, A, B+, B, C+, C, D, F
  createdAt: Date;
  updatedAt: Date;
  // Relations
  course?: {
    id: string;
    title: string;
    coverImage: string | null;
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
