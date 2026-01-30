/**
 * User Repository
 * Data access layer for User-related database operations
 */
import { prisma } from '../utils/prisma';
import { UserWithRelations, UserListItem, UserProfile, CreateTeacherDTO, UpdateUserDTO } from '../types/user.types';

/**
 * Include configuration for user list (admin view)
 */
const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  blocked: true,
  createdAt: true,
  _count: {
    select: {
      coursesTaught: true,
      enrollments: true,
    },
  },
};

/**
 * Include configuration for user profile
 */
const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  blocked: true,
  provider: true,
  createdAt: true,
  _count: {
    select: {
      coursesTaught: true,
      enrollments: true,
      examAttempts: true,
      homeworkSubmissions: true,
      grades: true,
    },
  },
  enrollments: {
    include: {
      course: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    take: 10,
    orderBy: { enrolledAt: 'desc' as const },
  },
  coursesTaught: {
    select: {
      id: true,
      title: true,
      coverImage: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    take: 10,
  },
  grades: {
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' as const },
  },
};

/**
 * Include configuration for simple user update/return
 */
const userSimpleSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  blocked: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
};

export class UserRepository {
  /**
   * Find all users (admin list view)
   */
  async findAll(): Promise<UserListItem[]> {
    return prisma.user.findMany({
      select: userListSelect,
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserListItem[]>;
  }

  /**
   * Find a user by ID (simple)
   */
  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      select: userSimpleSelect,
    }) as Promise<UserWithRelations | null>;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { email },
      select: userSimpleSelect,
    }) as Promise<UserWithRelations | null>;
  }

  /**
   * Find user profile by ID (detailed view)
   */
  async findProfileById(id: string): Promise<UserProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      select: userProfileSelect,
    }) as Promise<UserProfile | null>;
  }

  /**
   * Create a new teacher
   */
  async createTeacher(data: CreateTeacherDTO, passwordHash: string): Promise<UserWithRelations> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'TEACHER',
      },
      select: userSimpleSelect,
    }) as Promise<UserWithRelations>;
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserDTO, passwordHash?: string): Promise<UserWithRelations> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.blocked !== undefined) updateData.blocked = data.blocked;
    if (passwordHash !== undefined) updateData.passwordHash = passwordHash;

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: userSimpleSelect,
    }) as Promise<UserWithRelations>;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  /**
   * Check if user exists by ID
   */
  async existsById(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }
}

/**
 * Singleton instance
 */
export const userRepository = new UserRepository();
