import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get invoice statistics (Admin only)
router.get('/invoices', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const totalInvoices = await prisma.invoice.count({ where });
    const totalRevenue = await prisma.invoice.aggregate({
      where,
      _sum: { totalAmount: true },
    });

    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const invoicesByUser = await prisma.invoice.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Get user details
    const userIds = invoicesByUser.map((item) => item.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const invoicesByUserWithDetails = invoicesByUser.map((item) => ({
      ...item,
      user: users.find((u) => u.id === item.userId),
    }));

    // Recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      totalInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      invoicesByStatus,
      invoicesByUser: invoicesByUserWithDetails,
      recentInvoices,
    });
  } catch (error) {
    console.error('Get invoice statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get purchase order statistics (Admin only)
router.get('/purchase-orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const totalPurchaseOrders = await prisma.purchaseOrder.count({ where });
    const totalCost = await prisma.purchaseOrder.aggregate({
      where,
      _sum: { totalAmount: true },
    });

    const purchaseOrdersByStatus = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const purchaseOrdersByUser = await prisma.purchaseOrder.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Get user details
    const userIds = purchaseOrdersByUser.map((item) => item.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const purchaseOrdersByUserWithDetails = purchaseOrdersByUser.map((item) => ({
      ...item,
      user: users.find((u) => u.id === item.userId),
    }));

    // Recent purchase orders
    const recentPurchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      totalPurchaseOrders,
      totalCost: totalCost._sum.totalAmount || 0,
      purchaseOrdersByStatus,
      purchaseOrdersByUser: purchaseOrdersByUserWithDetails,
      recentPurchaseOrders,
    });
  } catch (error) {
    console.error('Get purchase order statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

