# Invoice Restructure Implementation Checklist

## Completed Tasks ✅

### Database Schema
- [x] Added Tax Invoice Details fields (taxInvNo, taxInvDate, chalanNo, chalanDate, orderNo, orderDate, paymentTerm, dueOn, brokerName)
- [x] Added IRN field
- [x] Added Billed To fields (billedToName, billedToAddress, billedToState, billedToGSTIN, billedToPANo)
- [x] Added Transporter Details fields (transporterName, lrNo, lrDate, vehicleNo, placeOfSupply, from, to, noOfBoxes)
- [x] Added ACK No field
- [x] Added Shipped To fields (shippedToName, shippedToAddress, shippedToState, shippedToGSTIN, shippedToPANo)
- [x] Added Tax settings with checkboxes (discountEnabled, discountRate, igstEnabled, igstRate, sgstEnabled, sgstRate, cgstEnabled, cgstRate)
- [x] Added Bank Details fields (bankDetails, branch, rtgsNeftIfscCode)
- [x] Added Terms & Conditions field (termsAndConditions)
- [x] Updated InvoiceItem model (added description, hsnCode, per fields)

### API Layer
- [x] Updated POST /api/invoices to accept all new fields
- [x] Made all new fields optional with proper defaults
- [x] Added calculation logic for optional taxes and discounts
- [x] Updated stock validation logic
- [x] Implemented proper error handling

### Frontend - New Form
- [x] Created InvoiceFormNew.tsx component
- [x] Implemented left column with Tax Invoice Details box
- [x] Implemented left column with IRN field
- [x] Implemented left column with Billed To box
- [x] Implemented right column with Transporter Details box
- [x] Implemented right column with ACK No field
- [x] Implemented right column with Shipped To box
- [x] Implemented Product Details section with editable fields
  - [x] Product selection
  - [x] HSN/SAC Code field
  - [x] Quantity field
  - [x] Rate field (editable, defaults to product price)
  - [x] Per field (editable, defaults to product unit)
  - [x] Description field (editable)
  - [x] Amount calculation
  - [x] Add/Remove items
- [x] Implemented Tax & Discount section with checkboxes
  - [x] Discount checkbox and rate field
  - [x] IGST checkbox and rate field
  - [x] SGST checkbox and rate field
  - [x] CGST checkbox and rate field
- [x] Implemented Bank Details section
  - [x] Bank Details textarea
  - [x] Branch field
  - [x] RTGS/NEFT/IFSC Code field
- [x] Implemented Terms & Conditions section
  - [x] Default text with proper wording
  - [x] Editable textarea
- [x] Implemented real-time totals calculation
- [x] Implemented PDF download functionality

### Frontend - UI Components
- [x] Created checkbox.tsx component for tax/discount toggles

### PDF Generation
- [x] Restructured HTML template for new layout
- [x] Implemented two-column layout
  - [x] Left column with Tax Invoice Details, IRN, Billed To
  - [x] Right column with Transporter, ACK No, Shipped To
- [x] Updated product table with new columns
  - [x] S.No column
  - [x] Description of Goods
  - [x] HSN/SAC Code
  - [x] Quantity
  - [x] Rate
  - [x] Per
  - [x] Amount
- [x] Updated summary section to show discount
- [x] Implemented amountToWords() function
- [x] Added Rupees in Words section
- [x] Added Bank Details box to PDF
- [x] Added Terms & Conditions box to PDF
- [x] Proper formatting and styling for A4 printing
- [x] Signature section

### Routing
- [x] Updated Dashboard.tsx to import InvoiceFormNew
- [x] Updated route to use new form component

### Documentation
- [x] Created INVOICE_RESTRUCTURE_CHANGES.md with comprehensive changes
- [x] Created implementation checklist

## Next Steps / Testing Required

### Testing
- [ ] Run Prisma migration: `npx prisma migrate dev --name add_invoice_fields`
- [ ] Test invoice creation with all new fields filled
- [ ] Test invoice creation with partial fields (should still work)
- [ ] Test PDF generation with all fields populated
- [ ] Test PDF generation with empty optional fields
- [ ] Test editable rate field (override product price)
- [ ] Test editable HSN code field
- [ ] Test editable description field
- [ ] Test editable per field
- [ ] Test discount calculation
- [ ] Test IGST/SGST/CGST calculations
- [ ] Test amount-to-words conversion for various amounts
- [ ] Test Terms & Conditions with default and custom text
- [ ] Test Bank Details display in PDF
- [ ] Verify PDF layout on A4 paper
- [ ] Test adding/removing line items
- [ ] Test real-time total calculation
- [ ] Test checkbox enable/disable for tax types
- [ ] Verify all date fields work properly
- [ ] Test with special characters in text fields

### Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test responsive design on mobile (if applicable)

### Integration Testing
- [ ] Invoice creation flow end-to-end
- [ ] PDF download functionality
- [ ] Stock deduction on invoice creation
- [ ] Invoice history/list view display
- [ ] Invoice status updates

## Known Limitations & Notes

1. All new fields are optional - form will still submit with minimal data
2. Backward compatibility maintained for existing invoices
3. Tax and discount are now optional instead of mandatory
4. Rate override is per-item, not global
5. Terms & Conditions come with sensible defaults but can be customized
6. PDF amount-to-words conversion supports Indian numbering system (rupees, lakh, crore)

## Files to Deploy

1. Updated migration files in `/server/prisma/migrations/`
2. `/server/src/routes/invoices.ts` - Updated API
3. `/client/src/pages/admin/InvoiceFormNew.tsx` - New form component
4. `/client/src/pages/admin/Dashboard.tsx` - Updated routing
5. `/client/src/components/ui/checkbox.tsx` - New UI component
6. `/server/prisma/schema.prisma` - Updated schema

## Rollback Plan

If needed, previous invoices can still be viewed as all new fields are optional. To rollback:
1. Revert the Prisma migration
2. Revert Dashboard.tsx to use InvoiceForm instead of InvoiceFormNew
3. Old InvoiceForm.tsx is still available if needed
