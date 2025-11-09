import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, barcode } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (barcode) {
      where.barcode = barcode as string;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('stock').isInt({ min: 0 }).optional(),
    body('barcode').trim().optional(),
    body('description').trim().optional(),
    body('unit').trim().optional(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, barcode, price, cost, stock = 0, unit = 'pcs' } = req.body;

      // Check if barcode already exists
      if (barcode) {
        const existingProduct = await prisma.product.findUnique({
          where: { barcode },
        });

        if (existingProduct) {
          return res.status(400).json({ error: 'Barcode already exists' });
        }
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          barcode: barcode || null,
          price,
          cost,
          stock,
          unit,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update product
router.put(
  '/:id',
  authenticate,
  [
    body('name').trim().notEmpty().optional(),
    body('price').isFloat({ min: 0 }).optional(),
    body('cost').isFloat({ min: 0 }).optional(),
    body('stock').isInt({ min: 0 }).optional(),
    body('barcode').trim().optional(),
    body('description').trim().optional(),
    body('unit').trim().optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, barcode, price, cost, stock, unit } = req.body;

      // Check if barcode already exists (excluding current product)
      if (barcode) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            barcode,
            id: { not: req.params.id },
          },
        });

        if (existingProduct) {
          return res.status(400).json({ error: 'Barcode already exists' });
        }
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(barcode !== undefined && { barcode: barcode || null }),
          ...(price !== undefined && { price }),
          ...(cost !== undefined && { cost }),
          ...(stock !== undefined && { stock }),
          ...(unit && { unit }),
        },
      });

      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

