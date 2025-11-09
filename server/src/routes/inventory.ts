import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get inventory status
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Calculate total inventory value
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + product.cost * product.stock,
      0
    );

    // Calculate total products count
    const totalProducts = products.length;

    // Calculate low stock items (stock < 10)
    const lowStockItems = products.filter((product) => product.stock < 10);

    // Calculate out of stock items
    const outOfStockItems = products.filter((product) => product.stock === 0);

    res.json({
      products,
      summary: {
        totalProducts,
        totalInventoryValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems,
        outOfStockItems,
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

