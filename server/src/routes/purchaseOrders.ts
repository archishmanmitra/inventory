import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const router = express.Router();
const prisma = new PrismaClient();

// Letterhead data
const LETTERHEAD = {
  companyName: 'M/S ROY ENTERPRISE',
  tagline: 'AN ISO 9001:2015 & 45001:2018 CERTIFIED CO. (MSME REGISTERED CO.)',
  address: 'OFFICE: 37/2 KAMINI SCHOOL LANE, SALKIA, HOWRAH - 711 106 (WEST BENGAL)',
  contact: '(+91)9831061571',
  email: 'msroyenterpriseindia@gmail.com',
  gstin: '19AZEPR3832Q1ZL',
  logoPath: 'assets/letterhead.png', // Path to logo file
};

// Load logo as base64
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), LETTERHEAD.logoPath);
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }
  return '';
}

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

// Create purchase order (new expanded form)
router.post(
  '/form',
  authenticate,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        items,
        poDate,
        gstNo,
        shipmentName,
        shipmentAddress,
        shipmentState,
        shipmentPhone,
        supplierName,
        supplierAddress,
        supplierState,
        supplierGSTNo,
        supplierPhone,
        supplierEmail,
        supplierContactPerson,
        discountEnabled,
        discountRate,
        igstEnabled,
        igstRate,
        cgstEnabled,
        cgstRate,
        sgstEnabled,
        sgstRate,
        paymentTerms,
        delivery,
        termsAndConditions,
      } = req.body;

      // Generate order number
      const count = await prisma.purchaseOrder.count();
      const orderNumber = `PO-${Date.now()}-${count + 1}`;

      // Calculate totals
      let subtotal = 0;
      const purchaseOrderItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }

        const rate = item.rate || product.cost;
        const discount = item.discount || 0;
        const value = (rate * item.quantity) - ((rate * item.quantity * discount) / 100);
        subtotal += value;

        purchaseOrderItems.push({
          productId: product.id,
          quantity: item.quantity,
          rate,
          value,
          discount,
          hsnCode: item.hsnCode,
          itemDescription: item.itemDescription,
          per: item.per || product.unit,
        });
      }

      const discountAmount = discountEnabled ? (subtotal * discountRate) / 100 : 0;
      const subtotalAfterDiscount = subtotal - discountAmount;
      const igstAmount = igstEnabled ? (subtotalAfterDiscount * igstRate) / 100 : 0;
      const sgstAmount = sgstEnabled ? (subtotalAfterDiscount * sgstRate) / 100 : 0;
      const cgstAmount = cgstEnabled ? (subtotalAfterDiscount * cgstRate) / 100 : 0;
      const netAmount = subtotalAfterDiscount + igstAmount + sgstAmount + cgstAmount;

      // Create purchase order with items
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          poDate: poDate ? new Date(poDate) : new Date(),
          gstNo,
          shipmentName,
          shipmentAddress,
          shipmentState,
          shipmentPhone,
          supplierName,
          supplierAddress,
          supplierState,
          supplierGSTNo,
          supplierPhone,
          supplierEmail,
          supplierContactPerson,
          discountEnabled,
          discountRate,
          igstEnabled,
          igstRate,
          cgstEnabled,
          cgstRate,
          sgstEnabled,
          sgstRate,
          totalAmount: subtotal,
          discountAmount,
          igstAmount,
          sgstAmount,
          cgstAmount,
          netAmount,
          paymentTerms,
          delivery,
          termsAndConditions,
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

// Create purchase order (simple form)
router.post(
  '/',
  authenticate,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: any) => {
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
  async (req: AuthRequest, res: any) => {
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

// Generate PDF
router.get('/:id/pdf', async (req: AuthRequest, res: any) => {
  let browser;
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

    // Generate HTML
    const logoBase64 = getLogoBase64();
    const html = generatePurchaseOrderHTML(purchaseOrder, LETTERHEAD, logoBase64);
    
    // Convert HTML to PDF using puppeteer
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // This solves most of the memory issues
      ],
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    // Use domcontentloaded instead of networkidle0 for faster rendering
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const pdf = await page.pdf({ format: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="po-${purchaseOrder.orderNumber}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF. Please try again later.' });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

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

// HTML template generator for Purchase Order
function generatePurchaseOrderHTML(purchaseOrder: any, letterhead: any, logoBase64: string = '') {
  const formatDate = (date: any) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Convert amount to words
  function amountToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    function convertToWords(n: number): string {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '');
      if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '');
      if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '');
      return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000) : '');
    }

    const rupeesInWords = convertToWords(rupees) || 'Zero';
    const paiseInWords = paise > 0 ? ' and ' + convertToWords(paise) + ' Paise' : '';
    return rupeesInWords + ' Rupees' + paiseInWords;
  }

  const itemRows = purchaseOrder.items
    .map(
      (item: any, index: number) => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #333; padding: 8px;">${item.itemDescription || item.product.name}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${item.hsnCode || '-'}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${item.quantity}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${(item.rate || 0).toFixed(2)}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${item.per || item.product.unit}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${(item.value || 0).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const logoHtml = logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="height: 80px; margin-bottom: 15px;">` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #333;
          line-height: 1.3;
        }
        .page { page-break-after: always; padding: 10mm; }
        .letterhead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 15px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .logo { flex-shrink: 0; width: 80px; }
        .logo img { width: 80px; height: 100px; }
        .company-info {
          text-align: center;
          flex: 1;
          padding: 0 10px;
          margin-left: 80px;
          margin-right: 80px;
        }
        .letterhead-spacer { width: 80px; }  
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
        .company-tagline { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .company-address { font-size: 10px; margin-bottom: 2px; }
        .company-contact { font-size: 10px; }
        .document-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
        }
        .section-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .section-col { flex: 1; }
        .address-section {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          border: 1px solid #333;
        }
        .address-box {
          flex: 1;
          padding: 10px;
          border-right: 1px solid #333;
        }
        .address-box:last-child {
          border-right: none;
        }
        .address-title { font-weight: bold; margin-bottom: 8px; font-size: 11px; text-decoration: underline; }
        .address-field { display: flex; margin-bottom: 4px; font-size: 10px; }
        .field-label { font-weight: bold; width: 40%; }
        .field-value { flex: 1; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 10px;
        }
        th, td { border: 1px solid #333; padding: 6px; }
        th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
        .summary { margin-bottom: 10px; }
        .summary-section { display: flex; gap: 20px; margin-bottom: 10px; }
        .summary-col { flex: 1; }
        .summary-box { border: 1px solid #333; padding: 10px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; }
        .summary-row.total { font-weight: bold; border-top: 1px solid #333; border-bottom: 2px solid #333; padding-top: 6px; padding-bottom: 6px; }
        .amount-in-words { border: 1px solid #333; padding: 8px; margin-bottom: 10px; font-weight: bold; font-size: 10px; }
        .terms-box {
          border: 1px solid #333;
          padding: 8px;
          margin-bottom: 10px;
          font-size: 9px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .signature-section { display: flex; justify-content: space-between; margin-top: 20px; text-align: center; }
        .signature-box { width: 30%; }
        .signature-line { border-top: 1px solid #333; margin-top: 30px; font-size: 10px; padding-top: 5px; }
        @media print { body { margin: 0; padding: 0; } .page { padding: 10mm; page-break-after: always; } }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Letterhead -->
        <div class="letterhead">
        ${logoHtml ? `<div class="logo">${logoHtml}</div>` : ''}
        <div class="company-info">
        <div class="company-name">${letterhead.companyName}</div>
        <div class="company-tagline">${letterhead.tagline}</div>
        <div class="company-address">${letterhead.address}</div>
        <div class="company-contact">Contact: ${letterhead.contact} | Email: ${letterhead.email}</div>
        <div style="font-size: 10px; margin-top: 3px;">GSTIN: ${letterhead.gstin}</div>
        </div>
          <div class="letterhead-spacer"></div>
         </div>

        <!-- Document Title -->
        <div class="document-title">PURCHASE ORDER</div>

        <!-- Shipment and PO Details -->
        <div style="display: flex; gap: 15px; margin-bottom: 15px; font-size: 10px;">
          <div style="flex: 1;">
            <div style="font-weight: bold;">Purchase Order No. :</div>
            <div style="margin-bottom: 8px;">${purchaseOrder.orderNumber}</div>
            <div style="font-weight: bold;">Purchase Order Date :</div>
            <div>${formatDate(purchaseOrder.poDate)}</div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="font-weight: bold;">GST NO. :</div>
            <div>${purchaseOrder.gstNo || '-'}</div>
          </div>
        </div>

        <!-- Address Section -->
        <div class="address-section">
          <!-- Shipment Address -->
          <div class="address-box">
            <div class="address-title">SHIPMENT ADDRESS</div>
            <div class="address-field">
              <div class="field-label">Company Name</div>
              <div class="field-value">: ${purchaseOrder.shipmentName || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Address</div>
              <div class="field-value">: ${purchaseOrder.shipmentAddress || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">State</div>
              <div class="field-value">: ${purchaseOrder.shipmentState || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Phone</div>
              <div class="field-value">: ${purchaseOrder.shipmentPhone || '-'}</div>
            </div>
          </div>

          <!-- Vendor/Supplier Address -->
          <div class="address-box">
            <div class="address-title">VENDOR ADDRESS</div>
            <div class="address-field">
              <div class="field-label">Supplier Name</div>
              <div class="field-value">: ${purchaseOrder.supplierName || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Supplier Address</div>
              <div class="field-value">: ${purchaseOrder.supplierAddress || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">State Name</div>
              <div class="field-value">: ${purchaseOrder.supplierState || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">GST NO.</div>
              <div class="field-value">: ${purchaseOrder.supplierGSTNo || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Phone No.</div>
              <div class="field-value">: ${purchaseOrder.supplierPhone || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Email</div>
              <div class="field-value">: ${purchaseOrder.supplierEmail || '-'}</div>
            </div>
            <div class="address-field">
              <div class="field-label">Cont. Person</div>
              <div class="field-value">: ${purchaseOrder.supplierContactPerson || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Product Details Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">SL No.</th>
              <th>Item Description</th>
              <th style="width: 10%;">HSN Code</th>
              <th style="width: 10%;">Quantity</th>
              <th style="width: 12%;">Rate/Unit</th>
              <th style="width: 8%;">Per</th>
              <th style="width: 12%;">Value</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-col"></div>
          <div class="summary-col">
            <div class="summary-box">
              <div class="summary-row">
                <span>Total</span>
                <span>₹${(purchaseOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
              ${
                purchaseOrder.discountAmount && purchaseOrder.discountAmount > 0
                  ? `<div class="summary-row"><span>Discount (${purchaseOrder.discountRate}%):</span><span>-₹${purchaseOrder.discountAmount.toFixed(2)}</span></div>`
                  : ''
              }
              ${
                purchaseOrder.cgstAmount && purchaseOrder.cgstAmount > 0
                  ? `<div class="summary-row"><span>CGST (${purchaseOrder.cgstRate}%):</span><span>₹${purchaseOrder.cgstAmount.toFixed(2)}</span></div>`
                  : ''
              }
              ${
                purchaseOrder.sgstAmount && purchaseOrder.sgstAmount > 0
                  ? `<div class="summary-row"><span>SGST (${purchaseOrder.sgstRate}%):</span><span>₹${purchaseOrder.sgstAmount.toFixed(2)}</span></div>`
                  : ''
              }
              ${
                purchaseOrder.igstAmount && purchaseOrder.igstAmount > 0
                  ? `<div class="summary-row"><span>IGST (${purchaseOrder.igstRate}%):</span><span>₹${purchaseOrder.igstAmount.toFixed(2)}</span></div>`
                  : ''
              }
              <div class="summary-row total">
                <span>Net PO Amount</span>
                <span>₹${(purchaseOrder.netAmount || purchaseOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Amount in Words -->
        <div class="amount-in-words">
          Amount in Words : ${amountToWords(purchaseOrder.netAmount || purchaseOrder.totalAmount || 0)}
        </div>

        <!-- Payment & Delivery Terms -->
        <div style="border: 1px solid #333; padding: 10px; margin-bottom: 10px; font-size: 10px;">
          <div style="margin-bottom: 6px;">
            <span style="font-weight: bold;">Payment Terms</span>
            <span style="margin-left: 10px;">: ${purchaseOrder.paymentTerms || '-'}</span>
          </div>
          <div>
            <span style="font-weight: bold;">Delivery</span>
            <span style="margin-left: 10px;">: ${purchaseOrder.delivery || '-'}</span>
          </div>
        </div>

        <!-- Special Terms and Conditions -->
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 10px;">SPECIAL TERMS AND CONDITIONS</div>
          <div class="terms-box">
            ${
              purchaseOrder.termsAndConditions
                ? purchaseOrder.termsAndConditions
                    .split('\n')
                    .map((line: string, idx: number) => `<div style="margin-bottom: 4px;">${idx + 1}. ${line.trim()}</div>`)
                    .join('')
                : '<div>N/A</div>'
            }
          </div>
        </div>

        <!-- Signature Section -->
        <div style="text-align: right; margin-top: 20px;">
          <div style="border-top: 1px solid #333; padding-top: 30px; font-size: 10px;">
            <div style="font-weight: bold;">PROPRIETOR,</div>
            <div style="margin-top: 5px;">${letterhead.companyName}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default router;

