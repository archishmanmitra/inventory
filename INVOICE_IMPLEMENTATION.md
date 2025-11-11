# Invoice Implementation - Complete Feature

## Changes Made

### 1. Database Schema (Prisma)
Updated `server/prisma/schema.prisma` to expand Invoice model with:
- Customer details: `customerName`, `customerAddress`, `customerGSTIN`, `customerPhone`, `customerEmail`
- Order details: `orderDate`, `dueDate`, `paymentTerms`, `transportMode`, `shipPlace`
- Tax fields: `sgstAmount`, `cgstAmount`, `igstAmount`, `netAmount`

### 2. Backend API (`server/src/routes/invoices.ts`)
- **POST /api/invoices** - Enhanced to accept all new customer and order fields with tax calculations
- **GET /api/invoices/:id/pdf** - New endpoint that generates HTML invoice with:
  - Company letterhead (M/S ROY ENTERPRISE with ISO certification)
  - Professional invoice layout
  - Itemized table with product details
  - Tax breakdown (SGST/CGST/IGST)
  - Summary section
  - Signature area

### 3. Frontend Form (`client/src/pages/admin/InvoiceForm.tsx`)
New dedicated invoice creation form with:
- Customer details section (name, phone, email, GSTIN, address)
- Order details section (order date, due date, payment terms, transport mode, ship place)
- Tax rates configuration (SGST, CGST, IGST percentages)
- Dynamic line items (add/remove products)
- Real-time totals summary
- PDF download button after successful creation

### 4. Updated Views
- **client/src/pages/shared/Invoices.tsx** - Added download button (💾 icon) to each invoice row
- **client/src/pages/admin/Dashboard.tsx** - Added route for new invoice form page

## Installation & Setup

### 1. Apply Database Migration
```bash
cd server
npx prisma migrate dev --name add_invoice_details
```
This will:
- Create migration file
- Apply changes to your database
- Regenerate Prisma client

### 2. Build and Run
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Features

### Create Invoice
1. Navigate to Admin Dashboard → Invoices
2. Click "Create Invoice" button OR
3. Go to `/admin/invoices/create` for dedicated form view
4. Fill in:
   - Customer details
   - Order details
   - Select products and quantities
   - Configure tax rates
5. System calculates totals automatically
6. Click "Create Invoice"
7. On success, download PDF button appears

### Download Invoice
- Click 💾 Download button next to any invoice in the list
- PDF opens in new tab showing professional invoice with:
  - Company letterhead
  - Customer information
  - Item details with pricing
  - Tax calculation breakdown
  - Net amount

## Data Flow

### Creating an Invoice
```
Form Input 
  ↓
Validation (customer name, order date, items required)
  ↓
Calculate Subtotal
  ↓
Calculate Taxes (SGST/CGST/IGST based on rates)
  ↓
POST to /api/invoices with all data
  ↓
Backend validates products & stock
  ↓
Creates invoice with items
  ↓
Deducts from inventory
  ↓
Returns created invoice (success message + download button)
```

### Downloading Invoice
```
Click Download Button
  ↓
GET /api/invoices/:id/pdf
  ↓
Backend generates HTML with letterhead
  ↓
Browser downloads/opens HTML as PDF
  ↓
User can print or save as PDF
```

## Letterhead Details

Company information embedded in every invoice:
- **Company**: M/S ROY ENTERPRISE
- **Tagline**: AN ISO 9001:2015 & 45001:2018 CERTIFIED CO. (MSME REGISTERED CO.)
- **Address**: 37/2 KAMINI SCHOOL LANE, SALKIA, HOWRAH - 711 106 (WEST BENGAL)
- **Contact**: (+91)9831061571
- **Email**: msroyenterpriseindia@gmail.com
- **GSTIN**: 19AZEPR3832Q1ZL

## Customization

### Change Default Tax Rates
In `InvoiceForm.tsx`, modify defaultValues:
```tsx
sgstRate: 9,    // Change SGST rate
cgstRate: 9,    // Change CGST rate
igstRate: 0,    // Change IGST rate
```

### Modify Letterhead
Edit letterhead object in `server/src/routes/invoices.ts`:
```typescript
const LETTERHEAD = {
  companyName: 'Your Company Name',
  tagline: 'Your tagline',
  address: 'Your address',
  contact: 'Contact number',
  email: 'Email address',
  gstin: 'Your GSTIN',
};
```

### Customize PDF Styling
Modify the CSS in `generateInvoiceHTML()` function to change fonts, colors, layout, etc.

## API Endpoints

### Create Invoice
```
POST /api/invoices
Headers: Authorization: Bearer <token>
Body: {
  customerName: string,           // Required
  customerAddress: string,        // Optional
  customerGSTIN: string,          // Optional
  customerPhone: string,          // Optional
  customerEmail: string,          // Optional
  orderDate: ISO date,            // Required
  dueDate: ISO date,              // Optional
  paymentTerms: string,           // Optional
  transportMode: string,          // Optional
  shipPlace: string,              // Optional
  sgstRate: number,               // Optional, default: 9
  cgstRate: number,               // Optional, default: 9
  igstRate: number,               // Optional, default: 0
  items: [
    {
      productId: string,          // Required
      quantity: number            // Required, min: 1
    }
  ]                               // Required, min: 1 item
}
```

### Get Invoice as PDF/HTML
```
GET /api/invoices/:id/pdf
Headers: Authorization: Bearer <token>
Response: HTML content (can be printed/saved as PDF)
```

## Testing

1. **Create an invoice** with:
   - Customer: "Test Customer"
   - Order Date: Today
   - Add 2-3 products
   - Adjust quantities
   
2. **Verify totals** - Should show subtotal + taxes = net amount

3. **Download PDF** - Should open in new tab with professional formatting

4. **Check inventory** - Products should be deducted from stock

## Troubleshooting

### "Product not found" error
- Ensure products exist in the database
- Check product IDs match

### "Insufficient stock" error
- Check available stock for selected products
- Reduce quantities or select different products

### PDF not displaying correctly
- Try different browser (Chrome recommended)
- Ensure JavaScript is enabled
- Check browser console for errors

### Database migration issues
```bash
# Reset and re-migrate (careful - deletes data)
npx prisma migrate reset

# Or rollback and retry
npx prisma migrate resolve --rolled-back <migration-name>
```

## Notes

- Invoice numbers are auto-generated: `INV-{timestamp}-{count}`
- PDFs are generated on-demand (not stored on server)
- All invoice data is persisted in database
- Tax calculation is automatic based on rates
- Stock is deducted when invoice is created
- Stock is restored if invoice is deleted
