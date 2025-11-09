import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all invoices (Admin sees all, Employee sees own)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    // Employees can only see their own invoices
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    const invoices = await prisma.invoice.findMany({
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

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single invoice
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only see their own invoices
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    const invoice = await prisma.invoice.findFirst({
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
                price: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create invoice
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

      // Generate invoice number
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${Date.now()}-${count + 1}`;

      // Calculate total and validate products
      let totalAmount = 0;
      const invoiceItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }

        // Check if there's enough stock
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        invoiceItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          subtotal,
        });
      }

      // Create invoice with items
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: req.user!.id,
          totalAmount,
          items: {
            create: invoiceItems,
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
                  price: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      // Update product stock when invoice is created (deduct from inventory)
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update invoice status
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

      // Employees can only update their own invoices
      if (req.user?.role === 'EMPLOYEE') {
        where.userId = req.user.id;
      }

      const invoice = await prisma.invoice.update({
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

      res.json(invoice);
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete invoice
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only delete their own invoices
    if (req.user?.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    // Get invoice with items before deleting to restore stock
    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id: req.params.id },
    });

    // Restore product stock when invoice is deleted
    for (const item of invoice.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

