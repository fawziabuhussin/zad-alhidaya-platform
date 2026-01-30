/**
 * Common types shared across the application
 */

/**
 * Represents a parent entity that can own resources (Course or Lesson)
 */
export interface ParentInfo {
  type: 'course' | 'lesson';
  id: string;
}

/**
 * Authentication context containing user information
 */
export interface AuthContext {
  userId: string;
  role: string;
}

/**
 * Result of an access check operation
 */
export interface AccessCheckResult {
  allowed: boolean;
  courseId?: string;
}
