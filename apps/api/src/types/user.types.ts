/**
 * User-specific types and DTOs
 */

/**
 * DTO for creating a new teacher
 */
export interface CreateTeacherDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  blocked?: boolean;
  password?: string;
}

/**
 * User with relations (includes related data)
 */
export interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  provider: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User list item (for admin user list)
 */
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  createdAt: Date;
  _count: {
    coursesTaught: number;
    enrollments: number;
  };
}

/**
 * User profile with full details
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  provider: string | null;
  createdAt: Date;
  _count: {
    coursesTaught: number;
    enrollments: number;
    examAttempts: number;
    homeworkSubmissions: number;
    grades: number;
  };
  enrollments: Array<{
    course: {
      id: string;
      title: string;
      coverImage: string | null;
    };
  }>;
  coursesTaught: Array<{
    id: string;
    title: string;
    coverImage: string | null;
    _count: {
      enrollments: number;
    };
  }>;
  grades: Array<{
    id: string;
    type: string;
    score: number;
    maxScore: number;
    percentage: number;
    letterGrade: string;
    createdAt: Date;
    course: {
      id: string;
      title: string;
    };
  }>;
}
