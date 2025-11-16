import express from "express";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const router = express.Router();
const prisma = new PrismaClient();

// Letterhead data
const LETTERHEAD = {
  companyName: "M/S ROY ENTERPRISE",
  tagline: "AN ISO 9001:2015 & 45001:2018 CERTIFIED CO. (MSME REGISTERED CO.)",
  address:
    "OFFICE: 37/2 KAMINI SCHOOL LANE, SALKIA, HOWRAH - 711 106 (WEST BENGAL)",
  contact: "(+91)9831061571",
  email: "msroyenterpriseindia@gmail.com",
  gstin: "19AZEPR3832Q1ZL",
  logoPath: "assets/letterhead.png", // Path to logo file
};

// Load logo as base64
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), LETTERHEAD.logoPath);
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.error("Error loading logo:", error);
  }
  return "";
}

// Get all invoices (Admin sees all, Employee sees own)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    // Employees can only see their own invoices
    if (req.user?.role === "EMPLOYEE") {
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
      orderBy: { createdAt: "desc" },
    });

    // Format response to include net amount if not present
    const formattedInvoices = invoices.map((inv: any) => ({
      ...inv,
      totalAmount: inv.netAmount || inv.totalAmount,
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single invoice
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only see their own invoices
    if (req.user?.role === "EMPLOYEE") {
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
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create invoice
router.post(
  "/",
  authenticate,
  [
    body("items").isArray({ min: 1 }),
    body("items.*.productId").notEmpty(),
    body("items.*.quantity").isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        items,
        // Tax Invoice Details
        taxInvNo,
        taxInvDate,
        chalanNo,
        chalanDate,
        orderNo,
        orderDate,
        paymentTerm,
        dueOn,
        brokerName,
        // IRN
        irn,
        // Billed To
        billedToName,
        billedToAddress,
        billedToState,
        billedToGSTIN,
        billedToPANo,
        // Transporter
        transporterName,
        lrNo,
        lrDate,
        vehicleNo,
        placeOfSupply,
        from,
        to,
        noOfBoxes,
        // ACK
        ackNo,
        // Shipped To
        shippedToName,
        shippedToAddress,
        shippedToState,
        shippedToGSTIN,
        shippedToPANo,
        // Tax settings
        discountEnabled = false,
        discountRate = 0,
        transportChargesEnabled = false,
        transportCharges = 0,
        igstEnabled = false,
        igstRate = 18,
        sgstEnabled = false,
        sgstRate = 9,
        cgstEnabled = false,
        cgstRate = 9,
        // Bank Details
        bankDetails,
        branch,
        rtgsNeftIfscCode,
        // Terms
        termsAndConditions,
        // Signature
        signatureBy,
        signatureDate,
        // Adjusted total from frontend
        adjustedTotal,
      } = req.body;

      // Convert numeric strings to numbers
      const discountRateNum =
        typeof discountRate === "string"
          ? parseFloat(discountRate)
          : discountRate;
      const transportChargesNum =
        typeof transportCharges === "string"
          ? parseFloat(transportCharges)
          : transportCharges;
      const igstRateNum =
        typeof igstRate === "string" ? parseFloat(igstRate) : igstRate;
      const sgstRateNum =
        typeof sgstRate === "string" ? parseFloat(sgstRate) : sgstRate;
      const cgstRateNum =
        typeof cgstRate === "string" ? parseFloat(cgstRate) : cgstRate;

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
          return res
            .status(404)
            .json({ error: `Product ${item.productId} not found` });
        }

        // Check if there's enough stock
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }

        const price = item.price || product.price;
        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        invoiceItems.push({
          productId: product.id,
          quantity: item.quantity,
          price,
          subtotal,
          description: item.description || product.name,
          hsnCode: item.hsnCode || "",
          per: item.per || product.unit || "pcs",
        });
      }

      // Calculate discount
      const discountAmount = discountEnabled
        ? (totalAmount * discountRateNum) / 100
        : 0;
      const subtotalAfterDiscount = totalAmount - discountAmount;

      // Calculate transport charges
      const finalTransportCharges = transportChargesEnabled
        ? transportChargesNum
        : 0;
      const subtotalAfterTransport =
        subtotalAfterDiscount + finalTransportCharges;

      // Calculate taxes (applied after discount and transport charges)
      const sgstAmount = sgstEnabled
        ? (subtotalAfterTransport * sgstRateNum) / 100
        : 0;
      const cgstAmount = cgstEnabled
        ? (subtotalAfterTransport * cgstRateNum) / 100
        : 0;
      const igstAmount = igstEnabled
        ? (subtotalAfterTransport * igstRateNum) / 100
        : 0;
      const calculatedTotal =
        Math.floor(
          Math.abs(
            subtotalAfterTransport + sgstAmount + cgstAmount + igstAmount
          ) * 100
        ) / 100;
      const netAmount = adjustedTotal || calculatedTotal;

      // Create invoice with items
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: req.user!.id,
          // Tax Invoice Details
          taxInvNo: taxInvNo || "",
          taxInvDate: taxInvDate ? new Date(taxInvDate) : null,
          chalanNo: chalanNo || "",
          chalanDate: chalanDate ? new Date(chalanDate) : null,
          orderNo: orderNo || "",
          orderDate: orderDate ? new Date(orderDate) : null,
          paymentTerm: paymentTerm || "",
          dueOn: dueOn ? new Date(dueOn) : null,
          brokerName: brokerName || "",
          // IRN
          irn: irn || "",
          // Billed To
          billedToName: billedToName || "",
          billedToAddress: billedToAddress || "",
          billedToState: billedToState || "",
          billedToGSTIN: billedToGSTIN || "",
          billedToPANo: billedToPANo || "",
          // Transporter
          transporterName: transporterName || "",
          lrNo: lrNo || "",
          lrDate: lrDate ? new Date(lrDate) : null,
          vehicleNo: vehicleNo || "",
          placeOfSupply: placeOfSupply || "",
          from: from || "",
          to: to || "",
          noOfBoxes: noOfBoxes || "",
          // ACK
          ackNo: ackNo || "",
          // Shipped To
          shippedToName: shippedToName || "",
          shippedToAddress: shippedToAddress || "",
          shippedToState: shippedToState || "",
          shippedToGSTIN: shippedToGSTIN || "",
          shippedToPANo: shippedToPANo || "",
          // Tax settings
          discountEnabled,
          discountRate: discountRateNum,
          igstEnabled,
          igstRate: igstRateNum,
          sgstEnabled,
          sgstRate: sgstRateNum,
          cgstEnabled,
          cgstRate: cgstRateNum,
          // Bank Details
          bankDetails: bankDetails || "",
          branch: branch || "",
          rtgsNeftIfscCode: rtgsNeftIfscCode || "",
          // Terms
          termsAndConditions: termsAndConditions || "",
          // Signature
          signatureBy: signatureBy || "",
          signatureDate: signatureDate ? new Date(signatureDate) : null,
          // Totals
          totalAmount,
          discountAmount,
          transportAmount: finalTransportCharges,
          sgstAmount,
          cgstAmount,
          igstAmount,
          netAmount,
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
      console.error("Create invoice error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update invoice status
router.patch(
  "/:id/status",
  authenticate,
  [body("status").isIn(["pending", "completed", "cancelled"])],
  async (req: AuthRequest, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const where: any = { id: req.params.id };

      // Employees can only update their own invoices
      if (req.user?.role === "EMPLOYEE") {
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
      console.error("Update invoice error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Generate PDF
router.get("/:id/pdf", async (req: AuthRequest, res: any) => {
  let browser;
  try {
    const where: any = { id: req.params.id };

    // Employees can only see their own invoices
    if (req.user?.role === "EMPLOYEE") {
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
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Generate HTML
    const logoBase64 = getLogoBase64();
    const html = generateInvoiceHTML(invoice, LETTERHEAD, logoBase64);

    // Convert HTML to PDF using puppeteer
    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // This solves most of the memory issues
      ],
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    // Use domcontentloaded instead of networkidle0 for faster rendering
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const pdf = await page.pdf({ format: "A4" });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Generate PDF error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF. Please try again later." });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
});

// Delete invoice
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };

    // Employees can only delete their own invoices
    if (req.user?.role === "EMPLOYEE") {
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
      return res.status(404).json({ error: "Invoice not found" });
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

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// HTML template generator
function generateInvoiceHTML(
  invoice: any,
  letterhead: any,
  logoBase64: string = ""
) {
  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Convert total amount to words
  function amountToWords(num: number): string {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    function convertToWords(n: number): string {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + convertToWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          convertToWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + convertToWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          convertToWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 !== 0 ? " " + convertToWords(n % 100000) : "")
        );
      return (
        convertToWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 !== 0 ? " " + convertToWords(n % 10000000) : "")
      );
    }

    const rupeesInWords = convertToWords(rupees) || "Zero";
    const paiseInWords =
      paise > 0 ? " and " + convertToWords(paise) + " Paise" : "";
    return rupeesInWords + " Rupees" + paiseInWords;
  }

  const itemRows = invoice.items
    .map(
      (item: any, index: number) => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${
        index + 1
      }</td>
      <td style="border: 1px solid #333; padding: 8px;">${
        item.description || item.product.name
      }</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${
        item.hsnCode || "-"
      }</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${
        item.quantity
      }</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">₹${item.price.toFixed(
        2
      )}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${
        item.per || item.product.unit
      }</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${item.subtotal.toFixed(
        2
      )}</td>
    </tr>
  `
    )
    .join("");

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="width: 100px; height: auto; margin-bottom: 15px;">`
    : "";

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
          margin-bottom: 0px;
          border-bottom: 2px solid #333;
          padding-bottom: 0px;
        }
        .logo { flex-shrink: 0; width: 100px; }
        .logo img { width: 100px; height: auto; }
        .company-info {
          text-align: center;
          flex: 1.5;
          padding: 0 10px;
          margin-left: 0;
          margin-right: 0;
        }
        .letterhead-spacer { width: 80px; }  
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
        .company-tagline { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .company-address { font-size: 10px; margin-bottom: 2px; }
        .company-contact { font-size: 10px; }
        .invoice-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
        }
        .section-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .section-col { flex: 1; }
        .box {
          border: 1px solid #333;
          padding: 10px;
          margin-bottom: 10px;
        }
        
        .box-row { display: flex; margin-bottom: 4px; font-size: 10px; }
        .box-col { flex: 1; }
        .box-col-label { font-weight: bold; width: 45%; }
        .irn-field { margin-bottom: 10px; }
        .irn-label { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .irn-input { border: 1px solid #333; padding: 5px; width: 100%; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 10px;
        }
        th, td { border: 1px solid #333; padding: 6px; }
        th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
        .summary { margin-bottom: 10px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; }
        .summary-row.total { font-weight: bold; border-top: 1px solid #333; border-bottom: 2px solid #333; padding-top: 6px; padding-bottom: 6px; }
        .rupees-words { border: 1px solid #333; padding: 8px; margin-bottom: 10px; font-weight: bold; }
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
        ${logoHtml ? `<div class="logo">${logoHtml}</div>` : ""}
        <div class="company-info">
        <div class="company-name">${letterhead.companyName}</div>
        <div class="company-tagline">${letterhead.tagline}</div>
        <div class="company-address">${letterhead.address}</div>
        <div class="company-contact">Contact: ${letterhead.contact} | Email: ${
    letterhead.email
  }</div>
        <div style="font-size: 10px; margin-top: 3px;">GSTIN: ${
          letterhead.gstin
        }</div>
        </div>
          <div class="letterhead-spacer"></div>
         </div>

        <!-- Invoice Title -->
        <div class="invoice-title">TAX INVOICE</div>

        <!-- Two Column Section -->
         <div style="border: 1px solid #333;">
           <!-- ROW 1 -->
           <div style="display: flex; gap: 0; border-bottom: 1px solid #333;">
             <!-- LEFT COLUMN -->
             <div style="flex: 1; padding: 10px; border-right: 1px solid #333;">
               <!-- Tax Invoice Details -->
               <div style="font-size: 10px;">
                 <div style="font-weight: bold; margin-bottom: 6px; font-size: 11px;">Tax Invoice Details</div>
                 <div style="display: flex; margin-bottom: 4px; gap: 15px;">
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Tax Inv No.</span> <span style="font-weight: bold;">:</span> <span>${
                       invoice.taxInvNo || "-"
                     }</span></div>
                   </div>
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Date</span> <span style="font-weight: bold;">:</span> <span>${formatDate(
                       invoice.taxInvDate
                     )}</span></div>
                   </div>
                 </div>
                 <div style="display: flex; margin-bottom: 4px; gap: 15px;">
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Chalan No.</span> <span style="font-weight: bold;">:</span> <span>${
                       invoice.chalanNo || "-"
                     }</span></div>
                   </div>
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Date</span> <span style="font-weight: bold;">:</span> <span>${formatDate(
                       invoice.chalanDate
                     )}</span></div>
                   </div>
                 </div>
                 <div style="margin-bottom: 4px;">
                   <div><span style="font-weight: bold;">Order No.</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.orderNo || "-"
                   }</span></div>
                   <div><span style="font-weight: bold;">Order Date</span> <span style="font-weight: bold;">:</span> <span>${formatDate(
                     invoice.orderDate
                   )}</span></div>
                 </div>
                 <div style="display: flex; margin-bottom: 4px; gap: 15px;">
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Payment Term</span> <span style="font-weight: bold;">:</span> <span>${
                       invoice.paymentTerm || "-"
                     }</span></div>
                   </div>
                   <div style="flex: 1;">
                     <div><span style="font-weight: bold;">Due On</span> <span style="font-weight: bold;">:</span> <span>${formatDate(
                       invoice.dueOn
                     )}</span></div>
                   </div>
                 </div>
                 <div style="margin-bottom: 4px;">
                   <span style="font-weight: bold;">Broker Name</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.brokerName || "-"
                   }</span>
                 </div>
               </div>
             </div>

             <!-- RIGHT COLUMN -->
             <div style="flex: 1; padding: 10px;">
               <!-- Transporter Details -->
               <div style="font-size: 10px;">
                 <div style="font-weight: bold; margin-bottom: 6px; font-size: 11px;">Transporter Details</div>
                 <div style="margin-bottom: 4px;"><span style="font-weight: bold;">Transporter</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.transporterName || "-"
                 }</span></div>
                 <div style="display: flex; margin-bottom: 4px; gap: 15px;">
                   <div style="flex: 1;"><span style="font-weight: bold;">L.R.No.</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.lrNo || "-"
                   }</span></div>
                   <div style="flex: 1;"><span style="font-weight: bold;">Date</span> <span style="font-weight: bold;">:</span> <span>${formatDate(
                     invoice.lrDate
                   )}</span></div>
                 </div>
                 <div style="margin-bottom: 4px;"><span style="font-weight: bold;">Vehicle No.</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.vehicleNo || "-"
                 }</span></div>
                 <div style="margin-bottom: 4px;"><span style="font-weight: bold;">Place of Supply</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.placeOfSupply || "-"
                 }</span></div>
                 <div style="display: flex; margin-bottom: 4px; gap: 15px;">
                   <div style="flex: 1;"><span style="font-weight: bold;">From</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.from || "-"
                   }</span></div>
                   <div style="flex: 1;"><span style="font-weight: bold;">To</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.to || "-"
                   }</span></div>
                 </div>
                 <div><span style="font-weight: bold;">No.oF Boxes</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.noOfBoxes || "-"
                 }</span></div>
               </div>
             </div>
           </div>

           <!-- ROW 2 -->
           <div style="display: flex; gap: 0; border-bottom: 1px solid #333;">
             <!-- LEFT COLUMN -->
             <div style="flex: 1; padding: 10px; border-right: 1px solid #333;">
               <!-- IRN -->
               <div style="font-size: 10px;">
                 <div><span style="font-weight: bold;">IRN :</span> <span>${
                   invoice.irn || "-"
                 }</span></div>
               </div>
             </div>

             <!-- RIGHT COLUMN -->
             <div style="flex: 1; padding: 10px;">
               <!-- ACK No -->
               <div style="font-size: 10px;">
                 <div><span style="font-weight: bold;">ACK No. :</span> <span>${
                   invoice.ackNo || "-"
                 }</span></div>
               </div>
             </div>
           </div>

           <!-- ROW 3 -->
           <div style="display: flex; gap: 0;">
             <!-- LEFT COLUMN -->
             <div style="flex: 1; padding: 10px; border-right: 1px solid #333;">
               <!-- Billed To -->
               <div style="font-size: 10px;">
                 <div style="font-weight: bold; margin-bottom: 6px; font-size: 11px;">Billed To</div>
                 <div style="margin-bottom: 4px;"><span>${
                   invoice.billedToName || "-"
                 }</span></div>
                 ${
                   invoice.billedToAddress
                     ? `<div style="margin-bottom: 4px; white-space: pre-wrap;">${invoice.billedToAddress}</div>`
                     : ""
                 }
                 <div style="margin-bottom: 4px;"><span style="font-weight: bold;">State</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.billedToState || "-"
                 }</span></div>
                 <div style="display: flex; gap: 15px;">
                   <div style="flex: 1;"><span style="font-weight: bold;">GSTIN</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.billedToGSTIN || "-"
                   }</span></div>
                   <div style="flex: 1;"><span style="font-weight: bold;">P.A.No.:</span> <span>${
                     invoice.billedToPANo || "-"
                   }</span></div>
                 </div>
               </div>
             </div>

             <!-- RIGHT COLUMN -->
             <div style="flex: 1; padding: 10px;">
               <!-- Shipped To -->
               <div style="font-size: 10px;">
                 <div style="font-weight: bold; margin-bottom: 6px; font-size: 11px;">Shipped To</div>
                 <div style="margin-bottom: 4px;"><span>${
                   invoice.shippedToName || "-"
                 }</span></div>
                 ${
                   invoice.shippedToAddress
                     ? `<div style="margin-bottom: 4px; white-space: pre-wrap;">${invoice.shippedToAddress}</div>`
                     : ""
                 }
                 <div style="margin-bottom: 4px;"><span style="font-weight: bold;">State</span> <span style="font-weight: bold;">:</span> <span>${
                   invoice.shippedToState || "-"
                 }</span></div>
                 <div style="display: flex; gap: 15px;">
                   <div style="flex: 1;"><span style="font-weight: bold;">GSTIN</span> <span style="font-weight: bold;">:</span> <span>${
                     invoice.shippedToGSTIN || "-"
                   }</span></div>
                   <div style="flex: 1;"><span style="font-weight: bold;">P.A.No.:</span> <span>${
                     invoice.shippedToPANo || "-"
                   }</span></div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        <!-- Product Details Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th>Description of Goods</th>
              <th style="width: 12%;">HSN/SAC Code</th>
              <th style="width: 10%;">Quantity</th>
              <th style="width: 10%;">Rate</th>
              <th style="width: 8%;">Per</th>
              <th style="width: 12%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;"></div>
          <div style="width: 300px; border-top: 1px solid #333; border-left: 1px solid #333; padding: 10px;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 11px;">Summary</div>
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${invoice.totalAmount.toFixed(2)}</span>
              </div>
              ${
                invoice.discountAmount > 0
                  ? `<div class="summary-row"><span>Discount (${
                      invoice.discountRate
                    }%):</span><span>-₹${invoice.discountAmount.toFixed(
                      2
                    )}</span></div>
                     <div class="summary-row">
                       <span>Subtotal After Discount:</span>
                       <span>₹${(
                         invoice.totalAmount - invoice.discountAmount
                       ).toFixed(2)}</span>
                     </div>`
                  : ""
              }
              ${
                invoice.transportCharges > 0
                  ? `<div class="summary-row"><span>Transport Charges:</span><span>₹${invoice.transportCharges.toFixed(
                      2
                    )}</span></div>
                     <div class="summary-row">
                       <span>Subtotal After Transport:</span>
                       <span>₹${(
                         invoice.totalAmount -
                         invoice.discountAmount +
                         invoice.transportCharges
                       ).toFixed(2)}</span>
                     </div>`
                  : ""
              }
              ${
                invoice.sgstAmount > 0
                  ? `<div class="summary-row"><span>SGST (${
                      invoice.sgstRate
                    }%):</span><span>₹${invoice.sgstAmount.toFixed(
                      2
                    )}</span></div>`
                  : ""
              }
              ${
                invoice.cgstAmount > 0
                  ? `<div class="summary-row"><span>CGST (${
                      invoice.cgstRate
                    }%):</span><span>₹${invoice.cgstAmount.toFixed(
                      2
                    )}</span></div>`
                  : ""
              }
              ${
                invoice.igstAmount > 0
                  ? `<div class="summary-row"><span>IGST (${
                      invoice.igstRate
                    }%):</span><span>₹${invoice.igstAmount.toFixed(
                      2
                    )}</span></div>`
                  : ""
              }
              ${
                invoice.sgstAmount > 0 ||
                invoice.cgstAmount > 0 ||
                invoice.igstAmount > 0
                  ? `<div class="summary-row">
                      <span>Subtotal After Taxes:</span>
                      <span>₹${(
                        invoice.totalAmount -
                        invoice.discountAmount +
                        invoice.transportCharges +
                        invoice.sgstAmount +
                        invoice.cgstAmount +
                        invoice.igstAmount
                      ).toFixed(2)}</span>
                    </div>`
                  : ""
              }
              <div class="summary-row" style="color: #0066cc; font-weight: bold;">
                <span>Adjusted Total:</span>
                <span>₹${invoice.netAmount.toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>₹${invoice.netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rupees in Words -->
        <div class="rupees-words" style="border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 10px; margin-bottom: 10px; font-weight: bold; font-size: 10px;">
          Amount in Words: ${amountToWords(invoice.netAmount)}
        </div>

        <!-- Bank Details -->
        ${
          invoice.bankDetails || invoice.branch || invoice.rtgsNeftIfscCode
            ? `<div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 10px; margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 6px; font-size: 10px;">Bank Details</div>
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            ${
              invoice.bankDetails
                ? `<div style="font-size: 9px; white-space: pre-wrap; font-weight: bold;">${invoice.bankDetails}</div>`
                : ""
            }
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        <div><span style="font-weight: bold;">Branch:</span> <span>${
          invoice.branch || "-"
        }</span></div>
        <div><span style="font-weight: bold;">RTGS/NEFT/IFSC Code:</span> <span>${
          invoice.rtgsNeftIfscCode || "-"
        }</span></div>
          </div>
            </div>
           </div>`
            : ""
        }

        <!-- Footer Section with GSTIN, P.A.No., Terms & Conditions and Signature -->
        <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 10px;">
          <!-- GSTIN and P.A.No Row -->
          <div style="display: flex; gap: 20px; margin-bottom: 10px; font-size: 10px;">
            <div style="flex: 1;">
              <span style="font-weight: bold;">GSTIN:</span> <span>${letterhead.gstin || "-"}</span>
            </div>
            <div style="flex: 1; text-align: right;">
              <span style="font-weight: bold;"></span> <span></span>
            </div>
          </div>

          <!-- Terms & Conditions and Signature Section -->
          <div style="display: flex; gap: 20px; margin-bottom: 0;">
            <!-- Terms & Conditions -->
            <div style="flex: 1; border: 1px solid #333; padding: 8px; font-size: 9px;">
              <strong style="font-size: 10px;">Terms & Conditions:</strong><br/>
            ${
              invoice.termsAndConditions
                ? invoice.termsAndConditions
                    .split("\n")
                    .filter((line: string) => line.trim())
                    .map(
                      (line: string) =>
                        `<div style="margin-bottom: 4px;">• ${line.trim()}</div>`
                    )
                    .join("")
                : "<div>• N/A</div>"
            }
            </div>
            
            <!-- Signature Section -->
            <div style="width: 280px; border: 1px solid #333; padding: 8px;">
              <!-- Certified Statement -->
              <div style="font-size: 8px; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 6px;">
                Certified that the particulars given above are true and correct
              </div>

              <!-- Company Name at Top Right -->
              <div style="text-align: right; margin-bottom: 12px; margin-top: 6px;">
                <div style="font-size: 8px; font-weight: bold;">
                  For ${letterhead.companyName}
                </div>
              </div>

              <!-- Signature Area with Bottom Row -->
              <div style="display: flex; flex-direction: column; margin-top: 8px;">
                <!-- Top: Digital Signature and Signature Line -->
                <div style="display: flex; gap: 12px; flex: 1;">
                  <!-- Left: Digital Signature Info -->
                  <div style="flex: 1; font-size: 6px; line-height: 1.3; margin-left: 62px;">
                    <div style="margin-bottom: 1px;">
                      <span>Digitally signed by:</span>
                      <span>${invoice.signatureBy || "M/S Enterprise"}</span>
                    </div>
                    <div style="margin-bottom: 1px;">
                      <span>Reason:</span>
                      <span>I am approving this document</span>
                    </div>
                    <div style="margin-bottom: 1px;">
                      <span>Date:</span>
                      <span>${new Date(invoice.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <!-- Right: Signature Space with Line -->
                  <div style="flex: 1; text-align: right;">
                    <div style="margin-top: 6px;">
                      ${
                        invoice.signatureBy
                          ? `<div style="font-weight: bold; font-size: 8px;"></div>`
                          : ""
                      }
                    </div>
                  </div>
                </div>

                <!-- Bottom Row: E. & O. E. on left, Authorised Signatory on right -->
                <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 6px; border-top: 1px solid #ddd;">
                  <div style="font-size: 8px;">
                    E. &amp; O. E.
                  </div>
                  <div style="font-size: 8px; font-weight: bold;">
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default router;
