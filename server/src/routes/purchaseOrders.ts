import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all purchase orders (Admin sees all, Employee sees own)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    // Employees can only see their own purchase orders
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single purchase order
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only see their own purchase orders
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                cost: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase order
router.post(
  '/',
  authenticate,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { items } = req.body;

      // Generate order number
      const count = await prisma.purchaseOrder.count();
      const orderNumber = `PO-${Date.now()}-${count + 1}`;

      // Calculate total and validate products
      let totalAmount = 0;
      const purchaseOrderItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }

        const subtotal = product.cost * item.quantity;
        totalAmount += subtotal;

        purchaseOrderItems.push({
          productId: product.id,
          quantity: item.quantity,
          cost: product.cost,
          subtotal,
        });
      }

      // Create purchase order with items
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          totalAmount,
          items: {
            create: purchaseOrderItems,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  cost: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      // Update product stock when purchase order is created
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error('Create purchase order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update purchase order status
router.patch(
  '/:id/status',
  authenticate,
  [body('status').isIn(['pending', 'completed', 'cancelled'])],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const where: any = { id: req.params.id };

      // Employees can only update their own purchase orders
      if (req.user?.role === 'EMPLOYEE') {
        where.userId = req.user.id;
      }

      const purchaseOrder = await prisma.purchaseOrder.update({
        where,
        data: { status: req.body.status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      res.json(purchaseOrder);
    } catch (error) {
      console.error('Update purchase order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete purchase order
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only delete their own purchase orders
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    await prisma.purchaseOrder.delete({
      where,
    });

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

