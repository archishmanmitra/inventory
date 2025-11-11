# Invoice Form Restructure - Complete Implementation

## Overview
Complete restructuring of the invoice system to match the new PDF layout with separate sections for tax invoice details, billed to, transporter, and shipped to information.

## Database Schema Changes (Prisma)

### Invoice Model - New Fields Added

#### Tax Invoice Details Box
- `taxInvNo` - Tax Invoice Number
- `taxInvDate` - Tax Invoice Date
- `chalanNo` - Chalan Number
- `chalanDate` - Chalan Date
- `orderNo` - Order Number
- `orderDate` - Order Date
- `paymentTerm` - Payment Terms
- `dueOn` - Due On Date
- `brokerName` - Broker Name

#### IRN Field
- `irn` - Integrated Return Number

#### Billed To Information
- `billedToName` - Name of Billed To party
- `billedToAddress` - Full address (3-4 lines)
- `billedToState` - State
- `billedToGSTIN` - GSTIN
- `billedToPANo` - P.A. Number

#### Transporter Details
- `transporterName` - Transporter Company Name
- `lrNo` - Lorry Receipt Number
- `lrDate` - Lorry Receipt Date
- `vehicleNo` - Vehicle Number
- `placeOfSupply` - Place of Supply
- `from` - From Location
- `to` - To Location
- `noOfBoxes` - Number of Boxes

#### ACK Number
- `ackNo` - Acknowledgement Number

#### Shipped To Information
- `shippedToName` - Name of Shipped To party
- `shippedToAddress` - Full address (3-4 lines)
- `shippedToState` - State
- `shippedToGSTIN` - GSTIN
- `shippedToPANo` - P.A. Number

#### Tax Settings (Optional with Checkboxes)
- `discountEnabled` - Enable discount (boolean, default: false)
- `discountRate` - Discount percentage (default: 0)
- `igstEnabled` - Enable IGST (boolean, default: false)
- `igstRate` - IGST rate (default: 18%)
- `sgstEnabled` - Enable SGST (boolean, default: false)
- `sgstRate` - SGST rate (default: 9%)
- `cgstEnabled` - Enable CGST (boolean, default: false)
- `cgstRate` - CGST rate (default: 9%)

#### Bank Details
- `bankDetails` - Bank information (textarea)
- `branch` - Bank branch name
- `rtgsNeftIfscCode` - RTGS/NEFT/IFSC Code

#### Terms & Conditions
- `termsAndConditions` - T&C text (editable, has default text)

#### Totals
- `totalAmount` - Subtotal
- `discountAmount` - Discount amount (calculated)
- `sgstAmount` - SGST amount
- `cgstAmount` - CGST amount
- `igstAmount` - IGST amount
- `netAmount` - Final total

### InvoiceItem Model - New Fields Added
- `description` - Description of goods (editable per item)
- `hsnCode` - HSN/SAC Code (editable per item)
- `per` - Unit per item (editable, default from product unit)

## API Changes

### POST /api/invoices
Now accepts all new fields. Example structure:
```json
{
  "items": [...],
  "taxInvNo": "string",
  "taxInvDate": "date",
  "chalanNo": "string",
  "chalanDate": "date",
  "orderNo": "string",
  "orderDate": "date",
  "paymentTerm": "string",
  "dueOn": "date",
  "brokerName": "string",
  "irn": "string",
  "billedToName": "string",
  "billedToAddress": "string",
  "billedToState": "string",
  "billedToGSTIN": "string",
  "billedToPANo": "string",
  "transporterName": "string",
  "lrNo": "string",
  "lrDate": "date",
  "vehicleNo": "string",
  "placeOfSupply": "string",
  "from": "string",
  "to": "string",
  "noOfBoxes": "string",
  "ackNo": "string",
  "shippedToName": "string",
  "shippedToAddress": "string",
  "shippedToState": "string",
  "shippedToGSTIN": "string",
  "shippedToPANo": "string",
  "discountEnabled": boolean,
  "discountRate": number,
  "igstEnabled": boolean,
  "igstRate": number,
  "sgstEnabled": boolean,
  "sgstRate": number,
  "cgstEnabled": boolean,
  "cgstRate": number,
  "bankDetails": "string",
  "branch": "string",
  "rtgsNeftIfscCode": "string",
  "termsAndConditions": "string"
}
```

#### Editable Item Fields
Each item can now have:
- `price` - Overridable rate (defaults to product price)
- `description` - Description of goods
- `hsnCode` - HSN/SAC Code
- `per` - Unit per (defaults to product unit)

## Frontend Changes

### New Components

#### InvoiceFormNew.tsx
Complete redesign of the invoice creation form with:
- **Left Column Section:**
  - Tax Invoice Details Box (Tax Inv No, Date, Chalan No, Date, Order No, Order Date, Payment Term, Due On, Broker Name)
  - IRN Field
  - Billed To Box (Name, Address, State, GSTIN, P.A. No)

- **Right Column Section:**
  - Transporter Details Box (Name, L.R. No, Date, Vehicle No, Place of Supply, From, To, No of Boxes)
  - ACK No Field
  - Shipped To Box (Name, Address, State, GSTIN, P.A. No)

- **Product Details Section:**
  - Dynamic item rows with editable fields
  - Columns: Product, HSN/SAC Code, Quantity, Rate, Per, Description, Amount
  - Add/Remove items buttons

- **Tax & Discount Settings:**
  - Checkboxes for Discount, IGST, SGST, CGST
  - Conditional rate fields (only show when checkbox is enabled)
  - Default values: Discount 0%, IGST 18%, SGST 9%, CGST 9%

- **Bank Details Section:**
  - Bank Details (textarea)
  - Branch
  - RTGS/NEFT/IFSC Code

- **Terms & Conditions:**
  - Editable textarea with default text:
    ```
    Subject to Palghar Jurisdiction.
    Goods Once Sold Will not be taken back.
    Our Responsibility ceases as soon as the goods leaves our premises.
    Payment within Due Date otherwise 21% p.a. interest will be charged.
    ```

- **Totals Summary:**
  - Real-time calculation of:
    - Subtotal
    - Discount (if enabled)
    - Subtotal after discount
    - IGST/SGST/CGST (if enabled)
    - Total amount

#### checkbox.tsx
New UI component for checkbox inputs used in tax/discount options.

### Updated Components

#### Dashboard.tsx
- Changed import from `InvoiceForm` to `InvoiceFormNew`
- Updated route to use the new form component

## PDF Generation Changes

### Template Restructure
Completely redesigned HTML/CSS for PDF output matching the new form layout:

**Structure:**
1. **Letterhead** - Company info and logo
2. **Invoice Title** - "TAX INVOICE"
3. **Two-Column Layout:**
   - Left: Tax Invoice Details, IRN, Billed To
   - Right: Transporter Details, ACK No, Shipped To
4. **Product Details Table:**
   - Columns: S.No, Description of Goods, HSN/SAC Code, Quantity, Rate, Per, Amount
5. **Summary Box:**
   - Subtotal
   - Discount (if applicable)
   - Tax amounts (IGST/SGST/CGST as applicable)
   - Total Amount
6. **Rupees in Words:**
   - Automatic conversion of total amount to words
   - Example: "Fifty Thousand Two Hundred Thirty Four Rupees and Fifty Paise"
7. **Bank Details Box** (if provided)
8. **Terms & Conditions Box**
9. **Signature Section**

### New Functions

#### amountToWords(num: number): string
Converts numeric amounts to words in Indian numbering system:
- Handles rupees and paise
- Supports up to crores
- Returns formatted string like "Fifty Thousand Rupees"

### CSS Updates
- Optimized for A4 printing
- Proper page breaks with `@media print`
- All boxes have proper borders and padding
- Font sizes adjusted for readability (10-11px)
- Two-column layout for left/right sections

## Default Values

### Tax Rates
- Discount: 0% (disabled by default)
- IGST: 18% (disabled by default)
- SGST: 9% (disabled by default)
- CGST: 9% (disabled by default)

### Terms & Conditions
```
Subject to Palghar Jurisdiction.
Goods Once Sold Will not be taken back.
Our Responsibility ceases as soon as the goods leaves our premises.
Payment within Due Date otherwise 21% p.a. interest will be charged.
```

## Features Implemented

✅ All fields are editable while creating invoice
✅ Rate can be overridden per item (fetches from product initially)
✅ Tax and discount are optional via checkboxes
✅ Product description and HSN code are editable per item
✅ Amount calculation updates in real-time
✅ Automatic conversion of total to words in PDF
✅ Bank details are optional
✅ Terms & Conditions are editable with sensible defaults
✅ Proper PDF layout with all sections
✅ Two-column layout for left and right invoice details
✅ All dates are properly formatted in PDF

## Files Modified

1. `/d:/work/freelancing/inventory/server/prisma/schema.prisma` - Schema updates
2. `/d:/work/freelancing/inventory/server/src/routes/invoices.ts` - API updates & PDF generation
3. `/d:/work/freelancing/inventory/client/src/pages/admin/InvoiceFormNew.tsx` - New form component
4. `/d:/work/freelancing/inventory/client/src/pages/admin/Dashboard.tsx` - Route updates
5. `/d:/work/freelancing/inventory/client/src/components/ui/checkbox.tsx` - New UI component

## Migration Required

Run the Prisma migration to apply schema changes:
```bash
npx prisma migrate dev --name add_invoice_fields
```

## Notes

- All new fields are optional (allow NULL in database)
- Backward compatibility maintained for existing invoices
- Form automatically calculates totals based on enabled taxes
- PDF generation supports all new fields with proper formatting
- Editable fields in items include: description, hsnCode, per, price
