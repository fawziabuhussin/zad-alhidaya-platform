import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createCategorySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
});

// Create category (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create category' });
  }
});

// Update category (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createCategorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id },
      data,
    });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update category' });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete category' });
  }
});

export default router;




