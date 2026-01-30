# Route Refactoring Instructions for AI Agent

## Overview

This document provides step-by-step instructions for refactoring Express.js route files in the Zad Al-Hidaya Platform API into a clean, layered architecture. The refactoring separates concerns into distinct layers: Types, Schemas, Repositories, Services, Managers, and Routes.

**Your task:** Refactor the specified route file following this pattern exactly.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Existing Infrastructure You Can Use](#2-existing-infrastructure-you-can-use)
3. [Step-by-Step Refactoring Process](#3-step-by-step-refactoring-process)
4. [Code Templates](#4-code-templates)
5. [Naming Conventions](#5-naming-conventions)
6. [Checklist](#6-checklist)
7. [Example: Complete Reference Implementation](#7-example-complete-reference-implementation)

---

## 1. Architecture Overview

### Target Architecture

```
apps/api/src/
├── types/
│   ├── common.types.ts        ← ALREADY EXISTS - Shared interfaces
│   └── {entity}.types.ts      ← CREATE THIS - Entity-specific DTOs
├── schemas/
│   └── {entity}.schema.ts     ← CREATE THIS - Zod validation schemas
├── repositories/
│   ├── course.repository.ts   ← ALREADY EXISTS - Use for auth checks
│   └── {entity}.repository.ts ← CREATE THIS - Entity data access
├── services/
│   └── authorization.service.ts ← ALREADY EXISTS - Use for access control
├── managers/
│   └── {entity}.manager.ts    ← CREATE THIS - Business logic
└── routes/
    └── {entity}.ts            ← REFACTOR THIS - Slim HTTP controller
```

### Layer Responsibilities

| Layer | Responsibility | Contains |
|-------|---------------|----------|
| **Types** | Type definitions | DTOs, interfaces for the entity |
| **Schemas** | Validation | Zod schemas for request validation |
| **Repositories** | Data Access | Prisma queries, database operations only |
| **Services** | Shared Services | Authorization, email, etc. (reusable) |
| **Managers** | Business Logic | Orchestrates auth + data operations |
| **Routes** | HTTP Layer | Request parsing, response formatting only |

### Request Flow

```
HTTP Request 
    → Route (parse request, validate with Zod)
    → Manager (check auth, execute business logic)
    → Repository (database operations)
    → Response back up the chain
```

---

## 2. Existing Infrastructure You Can Use

### 2.1 Common Types (`apps/api/src/types/common.types.ts`)

This file already exists. Use these types:

```typescript
// ParentInfo - For entities that belong to Course or Lesson
export interface ParentInfo {
  type: 'course' | 'lesson';
  id: string;
}

// AuthContext - User information from JWT
export interface AuthContext {
  userId: string;
  role: string;
}

// AccessCheckResult - Result of authorization check
export interface AccessCheckResult {
  allowed: boolean;
  courseId?: string;
}
```

**When to use `ParentInfo`:** Only if your entity has a polymorphic relationship (can belong to either Course OR Lesson). If your entity only belongs to Course, you don't need ParentInfo - just use courseId directly.

### 2.2 Authorization Service (`apps/api/src/services/authorization.service.ts`)

This service already exists. Use it for access control:

```typescript
import { authorizationService } from '../services/authorization.service';

// Check if user can READ (Admin, Teacher, or Enrolled Student)
const access = await authorizationService.checkReadAccess(auth, parent);

// Check if user can WRITE (Admin or Teacher only)
const access = await authorizationService.checkWriteAccess(auth, parent);

// Get course from parent (course or lesson)
const course = await authorizationService.getCourseFromParent(parent);
```

**Methods available:**
- `checkReadAccess(auth: AuthContext, parent: ParentInfo)` - Returns `{ allowed: boolean, courseId?: string }`
- `checkWriteAccess(auth: AuthContext, parent: ParentInfo)` - Returns `{ allowed: boolean, courseId?: string }`
- `getCourseFromParent(parent: ParentInfo)` - Returns course with `{ id, teacherId }`

### 2.3 Course Repository (`apps/api/src/repositories/course.repository.ts`)

This repository already exists for course-related queries:

```typescript
import { courseRepository } from '../repositories/course.repository';

// Find course by ID
const course = await courseRepository.findById(courseId);

// Find course by lesson ID
const course = await courseRepository.findByLessonId(lessonId);

// Check if user is enrolled
const isEnrolled = await courseRepository.isUserEnrolled(userId, courseId);
```

---

## 3. Step-by-Step Refactoring Process

### Step 1: Analyze the Existing Route File

Before refactoring, analyze the route file to identify:

1. **Validation schemas** - Look for Zod schemas (z.object)
2. **Authorization logic** - Look for role checks, ownership checks
3. **Business logic** - Look for any logic beyond simple CRUD
4. **Database queries** - Look for prisma.{entity}.findMany, create, etc.
5. **Route handlers** - Count the endpoints (GET, POST, PUT, DELETE)

Example analysis questions:
- Does this entity belong to a Course? (common case)
- Does this entity belong to a Lesson? (like resources)
- Does it have polymorphic relationships?
- What authorization rules apply?

### Step 2: Create Types File

Create `apps/api/src/types/{entity}.types.ts`

**Include:**
1. Create DTO - Data for creating new entities
2. Update DTO - Data for updating entities
3. Entity with relations - Full entity type with included relations

**Template:**
```typescript
/**
 * {Entity}-specific types and DTOs
 */

/**
 * DTO for creating a new {entity}
 */
export interface Create{Entity}DTO {
  // Required fields from the Prisma schema
  title: string;
  // Optional fields
  description?: string;
}

/**
 * DTO for updating an existing {entity}
 */
export interface Update{Entity}DTO {
  title?: string;
  description?: string | null;
}

/**
 * {Entity} with relations (includes related data)
 */
export interface {Entity}WithRelations {
  id: string;
  title: string;
  description: string | null;
  // ... all fields from Prisma schema
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  course?: {
    id: string;
    title: string;
  };
}
```

### Step 3: Create Schema File

Create `apps/api/src/schemas/{entity}.schema.ts`

**Move the Zod schemas from the route file here:**

```typescript
/**
 * Validation schemas for {Entity}
 */
import { z } from 'zod';

/**
 * Schema for creating a new {entity}
 */
export const create{Entity}Schema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().max(1000).optional(),
  // Add other fields as needed
});

/**
 * Schema for updating an existing {entity}
 */
export const update{Entity}Schema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
});

/**
 * Type inference from schemas
 */
export type Create{Entity}Input = z.infer<typeof create{Entity}Schema>;
export type Update{Entity}Input = z.infer<typeof update{Entity}Schema>;
```

### Step 4: Create Repository File

Create `apps/api/src/repositories/{entity}.repository.ts`

**This contains ONLY database operations - no business logic:**

```typescript
/**
 * {Entity} Repository
 * Data access layer for {Entity}-related database operations
 */
import { prisma } from '../utils/prisma';
import { {Entity}WithRelations, Create{Entity}DTO, Update{Entity}DTO } from '../types/{entity}.types';

/**
 * Include configuration for fetching {entities} with relations
 */
const {entity}Include = {
  course: {
    select: { id: true, title: true },
  },
  // Add other relations as needed
};

export class {Entity}Repository {
  /**
   * Find all {entities} for a course
   */
  async findByCourseId(courseId: string): Promise<{Entity}WithRelations[]> {
    return prisma.{entity}.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {entity}Include,
    });
  }

  /**
   * Find a single {entity} by ID
   */
  async findById(id: string): Promise<{Entity}WithRelations | null> {
    return prisma.{entity}.findUnique({
      where: { id },
      include: {entity}Include,
    });
  }

  /**
   * Create a new {entity}
   */
  async create(data: Create{Entity}DTO, courseId: string, createdById: string): Promise<{Entity}WithRelations> {
    return prisma.{entity}.create({
      data: {
        ...data,
        courseId,
        // Add createdById if the entity tracks creator
      },
      include: {entity}Include,
    });
  }

  /**
   * Update an existing {entity}
   */
  async update(id: string, data: Update{Entity}DTO): Promise<{Entity}WithRelations> {
    return prisma.{entity}.update({
      where: { id },
      data,
      include: {entity}Include,
    });
  }

  /**
   * Delete an {entity}
   */
  async delete(id: string): Promise<void> {
    await prisma.{entity}.delete({ where: { id } });
  }

  /**
   * Check if {entity} exists and belongs to course
   */
  async existsInCourse(id: string, courseId: string): Promise<boolean> {
    const entity = await prisma.{entity}.findFirst({
      where: { id, courseId },
    });
    return !!entity;
  }
}

/**
 * Singleton instance
 */
export const {entity}Repository = new {Entity}Repository();
```

### Step 5: Create Manager File

Create `apps/api/src/managers/{entity}.manager.ts`

**This orchestrates authorization and data access:**

```typescript
/**
 * {Entity} Manager
 * Business logic layer for {entity} management
 */
import { {entity}Repository } from '../repositories/{entity}.repository';
import { authorizationService } from '../services/authorization.service';
import { AuthContext } from '../types/common.types';
import { Create{Entity}DTO, Update{Entity}DTO, {Entity}WithRelations } from '../types/{entity}.types';

/**
 * Result types for manager operations
 */
export interface {Entity}ListResult {
  success: boolean;
  data?: {Entity}WithRelations[];
  error?: { status: number; message: string };
}

export interface {Entity}Result {
  success: boolean;
  data?: {Entity}WithRelations;
  error?: { status: number; message: string };
}

export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}

export class {Entity}Manager {
  /**
   * List all {entities} for a course
   */
  async list{Entities}(auth: AuthContext, courseId: string): Promise<{Entity}ListResult> {
    // Check authorization
    const access = await authorizationService.checkReadAccess(auth, { type: 'course', id: courseId });
    
    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const entities = await {entity}Repository.findByCourseId(courseId);
    return { success: true, data: entities };
  }

  /**
   * Get a single {entity}
   */
  async get{Entity}(auth: AuthContext, courseId: string, entityId: string): Promise<{Entity}Result> {
    // Check authorization
    const access = await authorizationService.checkReadAccess(auth, { type: 'course', id: courseId });
    
    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالوصول' },
      };
    }

    const entity = await {entity}Repository.findById(entityId);
    
    if (!entity || entity.courseId !== courseId) {
      return {
        success: false,
        error: { status: 404, message: 'Not found' },
      };
    }

    return { success: true, data: entity };
  }

  /**
   * Create a new {entity}
   */
  async create{Entity}(
    auth: AuthContext,
    courseId: string,
    data: Create{Entity}DTO
  ): Promise<{Entity}Result> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });
    
    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالإضافة' },
      };
    }

    const entity = await {entity}Repository.create(data, courseId, auth.userId);
    return { success: true, data: entity };
  }

  /**
   * Update an existing {entity}
   */
  async update{Entity}(
    auth: AuthContext,
    courseId: string,
    entityId: string,
    data: Update{Entity}DTO
  ): Promise<{Entity}Result> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });
    
    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالتعديل' },
      };
    }

    // Verify entity exists and belongs to course
    const exists = await {entity}Repository.existsInCourse(entityId, courseId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'Not found' },
      };
    }

    const entity = await {entity}Repository.update(entityId, data);
    return { success: true, data: entity };
  }

  /**
   * Delete an {entity}
   */
  async delete{Entity}(
    auth: AuthContext,
    courseId: string,
    entityId: string
  ): Promise<DeleteResult> {
    // Check authorization
    const access = await authorizationService.checkWriteAccess(auth, { type: 'course', id: courseId });
    
    if (!access.allowed) {
      return {
        success: false,
        error: { status: 403, message: 'غير مسموح بالحذف' },
      };
    }

    // Verify entity exists and belongs to course
    const exists = await {entity}Repository.existsInCourse(entityId, courseId);
    if (!exists) {
      return {
        success: false,
        error: { status: 404, message: 'Not found' },
      };
    }

    await {entity}Repository.delete(entityId);
    return { success: true };
  }
}

/**
 * Singleton instance
 */
export const {entity}Manager = new {Entity}Manager();
```

### Step 6: Refactor Route File

Rewrite `apps/api/src/routes/{entity}.ts` to use the manager:

```typescript
/**
 * {Entity} Routes
 * HTTP layer - delegates to {Entity}Manager
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { {entity}Manager } from '../managers/{entity}.manager';
import { create{Entity}Schema, update{Entity}Schema } from '../schemas/{entity}.schema';

const router = express.Router();

/**
 * GET /courses/:courseId/{entities} - List all
 */
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    const result = await {entity}Manager.list{Entities}(
      { userId: req.user!.userId, role: req.user!.role },
      courseId
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch {entities}:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch {entities}' });
  }
});

/**
 * GET /:id - Get single
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const result = await {entity}Manager.get{Entity}(
      { userId: req.user!.userId, role: req.user!.role },
      courseId,
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch {entity}:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch {entity}' });
  }
});

/**
 * POST / - Create new
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = create{Entity}Schema.parse(req.body);
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const result = await {entity}Manager.create{Entity}(
      { userId: req.user!.userId, role: req.user!.role },
      courseId,
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.status(201).json(result.data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error('Failed to create {entity}:', error);
    res.status(500).json({ message: error.message || 'Failed to create {entity}' });
  }
});

/**
 * PUT /:id - Update
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = update{Entity}Schema.parse(req.body);
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const result = await {entity}Manager.update{Entity}(
      { userId: req.user!.userId, role: req.user!.role },
      courseId,
      id,
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json(result.data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error('Failed to update {entity}:', error);
    res.status(500).json({ message: error.message || 'Failed to update {entity}' });
  }
});

/**
 * DELETE /:id - Delete
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const result = await {entity}Manager.delete{Entity}(
      { userId: req.user!.userId, role: req.user!.role },
      courseId,
      id
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete {entity}:', error);
    res.status(500).json({ message: error.message || 'Failed to delete {entity}' });
  }
});

export default router;
```

---

## 4. Code Templates

### 4.1 Manager Result Types

All managers should return consistent result types:

```typescript
// For list operations
export interface {Entity}ListResult {
  success: boolean;
  data?: {Entity}WithRelations[];
  error?: { status: number; message: string };
}

// For single entity operations
export interface {Entity}Result {
  success: boolean;
  data?: {Entity}WithRelations;
  error?: { status: number; message: string };
}

// For delete operations
export interface DeleteResult {
  success: boolean;
  error?: { status: number; message: string };
}
```

### 4.2 Error Response Pattern

Use consistent error response pattern in routes:

```typescript
if (!result.success) {
  return res.status(result.error!.status).json({ message: result.error!.message });
}
```

### 4.3 Zod Validation Error Handling

Always handle Zod errors in POST and PUT routes:

```typescript
} catch (error: any) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  // ... rest of error handling
}
```

---

## 5. Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Types | `{entity}.types.ts` | `homework.types.ts` |
| Schemas | `{entity}.schema.ts` | `homework.schema.ts` |
| Repositories | `{entity}.repository.ts` | `homework.repository.ts` |
| Managers | `{entity}.manager.ts` | `homework.manager.ts` |
| Routes | `{entity}.ts` (unchanged) | `homework.ts` |

### Classes and Exports

| Type | Class Name | Export Name |
|------|------------|-------------|
| Repository | `HomeworkRepository` | `homeworkRepository` |
| Manager | `HomeworkManager` | `homeworkManager` |
| Service | `AuthorizationService` | `authorizationService` |

### Type Names

| Type | Pattern | Example |
|------|---------|---------|
| Create DTO | `Create{Entity}DTO` | `CreateHomeworkDTO` |
| Update DTO | `Update{Entity}DTO` | `UpdateHomeworkDTO` |
| With Relations | `{Entity}WithRelations` | `HomeworkWithRelations` |
| Zod Create | `create{Entity}Schema` | `createHomeworkSchema` |
| Zod Update | `update{Entity}Schema` | `updateHomeworkSchema` |

---

## 6. Checklist

Before starting, verify:
- [ ] Read and understand the existing route file
- [ ] Identify all Zod schemas to move
- [ ] Identify authorization requirements
- [ ] Check Prisma schema for entity fields and relations

Files to create:
- [ ] `apps/api/src/types/{entity}.types.ts`
- [ ] `apps/api/src/schemas/{entity}.schema.ts`
- [ ] `apps/api/src/repositories/{entity}.repository.ts`
- [ ] `apps/api/src/managers/{entity}.manager.ts`
- [ ] Refactor `apps/api/src/routes/{entity}.ts`

After refactoring:
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`
- [ ] Verify all imports are correct
- [ ] Test endpoints still work

---

## 7. Example: Complete Reference Implementation

The resources entity has been fully refactored. Use it as a reference:

### Reference Files

1. **Types:** [`apps/api/src/types/resource.types.ts`](../apps/api/src/types/resource.types.ts)
2. **Schemas:** [`apps/api/src/schemas/resource.schema.ts`](../apps/api/src/schemas/resource.schema.ts)
3. **Repository:** [`apps/api/src/repositories/resource.repository.ts`](../apps/api/src/repositories/resource.repository.ts)
4. **Manager:** [`apps/api/src/managers/resource.manager.ts`](../apps/api/src/managers/resource.manager.ts)
5. **Routes:** [`apps/api/src/routes/resources.ts`](../apps/api/src/routes/resources.ts)

### Common Types (use these, don't recreate):
- [`apps/api/src/types/common.types.ts`](../apps/api/src/types/common.types.ts)

### Authorization Service (use this, don't recreate):
- [`apps/api/src/services/authorization.service.ts`](../apps/api/src/services/authorization.service.ts)

### Course Repository (use this for auth-related course queries):
- [`apps/api/src/repositories/course.repository.ts`](../apps/api/src/repositories/course.repository.ts)

---

## Special Cases

### 1. Entity with Polymorphic Parent (like Resources)

If an entity can belong to EITHER a Course OR a Lesson:

1. Use `ParentInfo` type from `common.types.ts`
2. In repository, handle both cases:
```typescript
async findByParent(parent: ParentInfo) {
  const where = parent.type === 'course' 
    ? { courseId: parent.id }
    : { lessonId: parent.id };
  // ...
}
```

### 2. Entity with Nested Routes

If the route is nested (e.g., `/courses/:courseId/homework`):

1. Use `mergeParams: true` in router:
```typescript
const router = express.Router({ mergeParams: true });
```

2. Extract params:
```typescript
const { courseId, homeworkId } = req.params;
```

### 3. Entity with Special Authorization

If authorization is different from standard read/write:

1. Add new method to `AuthorizationService`
2. Or implement custom check in the Manager

### 4. Entity with Complex Business Logic

If there's complex business logic beyond CRUD:

1. Add methods to the Manager for specific operations
2. Keep validation in the Zod schemas
3. Keep database operations in the Repository

---

## Arabic Error Messages

Use Arabic for user-facing error messages:

| Action | Message |
|--------|---------|
| Read denied | `غير مسموح بالوصول` |
| Write denied | `غير مسموح بالإضافة` |
| Update denied | `غير مسموح بالتعديل` |
| Delete denied | `غير مسموح بالحذف` |
| Not found | Keep in English or use `غير موجود` |

---

## Summary

1. **Types** - Define DTOs and interfaces
2. **Schemas** - Move Zod validation schemas
3. **Repository** - Extract database operations (no business logic)
4. **Manager** - Add authorization + orchestrate operations
5. **Routes** - Slim down to HTTP handling only
6. **Use existing** - Authorization Service, Course Repository, Common Types

Follow the templates exactly for consistency across all refactored files.
