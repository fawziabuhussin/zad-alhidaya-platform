/**
 * User Manager
 * Business logic layer for user management
 */
import { userRepository } from '../repositories/user.repository';
import { AuthContext } from '../types/common.types';
import { CreateTeacherDTO, UpdateUserDTO, UserListItem, UserWithRelations, UserProfile } from '../types/user.types';
import { hashPassword } from '../utils/password';

/**
 * Result types for manager operations
 */
export interface UserListResult {
  success: boolean;
  data?: UserListItem[];
  error?: { status: number; message: string };
}

export interface UserResult {
  success: boolean;
  data?: UserWithRelations;
  error?: { status: number; message: string };
}

export interface UserProfileResult {
  success: boolean;
  data?: UserProfile;
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

export class UserManager {
  /**
   * List all users (Admin only)
   */
  async listUsers(auth: AuthContext): Promise<UserListResult> {
    // Check authorization - only admins can list users
    if (auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const users = await userRepository.findAll();
    return { success: true, data: users };
  }

  /**
   * Create a new teacher (Admin only)
   */
  async createTeacher(auth: AuthContext, data: CreateTeacherDTO): Promise<UserResult> {
    // Check authorization - only admins can create teachers
    if (auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    // Check if email already exists
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      return {
        success: false,
        error: { status: 400, message: 'البريد الإلكتروني مسجل مسبقاً' },
      };
    }

    // Hash password and create teacher
    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.createTeacher(data, passwordHash);
    
    return { success: true, data: user };
  }

  /**
   * Update an existing user
   * Admin can update any user, users can update themselves (limited fields)
   */
  async updateUser(
    auth: AuthContext,
    userId: string,
    data: UpdateUserDTO
  ): Promise<UserResult> {
    const isAdmin = auth.role === 'ADMIN';
    const isSelf = auth.userId === userId;

    // Check if user has permission to update
    if (!isAdmin && !isSelf) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Non-admins can only update name and email
    if (!isAdmin && (data.role !== undefined || data.blocked !== undefined || data.password !== undefined)) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Verify user exists
    const exists = await userRepository.existsById(userId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'المستخدم غير موجود' },
      };
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    }

    const user = await userRepository.update(userId, data, passwordHash);
    return { success: true, data: user };
  }

  /**
   * Get user profile
   * Admin can view any profile, users can only view their own
   */
  async getUserProfile(auth: AuthContext, userId: string): Promise<UserProfileResult> {
    const isAdmin = auth.role === 'ADMIN';
    const isSelf = auth.userId === userId;

    if (!isAdmin && !isSelf) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const user = await userRepository.findProfileById(userId);
    
    if (!user) {
      return {
        success: false,
        error: { status: 404, message: 'المستخدم غير موجود' },
      };
    }

    return { success: true, data: user };
  }

  /**
   * Delete a user (Admin only)
   */
  async deleteUser(auth: AuthContext, userId: string): Promise<DeleteResult> {
    // Check authorization - only admins can delete users
    if (auth.role !== 'ADMIN') {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    // Prevent admin from deleting themselves
    if (auth.userId === userId) {
      return {
        success: false,
        error: { status: 400, message: 'لا يمكن حذف حسابك الخاص' },
      };
    }

    // Verify user exists
    const exists = await userRepository.existsById(userId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'المستخدم غير موجود' },
      };
    }

    await userRepository.delete(userId);
    return { success: true };
  }
}

/**
 * Singleton instance
 */
export const userManager = new UserManager();
