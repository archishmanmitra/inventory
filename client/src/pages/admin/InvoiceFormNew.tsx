import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Download, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}

interface InvoiceItem {
  productId: string;
  quantity: number;
  price?: number;
  description?: string;
  hsnCode?: string;
  per?: string;
}

const DEFAULT_TERMS = `Subject to Palghar Jurisdiction.
Goods Once Sold Will not be taken back.
Our Responsibility ceases as soon as the goods leaves our premises.
Payment within Due Date otherwise 21% p.a. interest will be charged.`;

export default function InvoiceFormNew({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { productId: "", quantity: 1 },
  ]);

  const [formData, setFormData] = useState({
    // Tax Invoice Details
    taxInvNo: "",
    taxInvDate: new Date().toISOString().split("T")[0],
    chalanNo: "",
    chalanDate: "",
    orderNo: "",
    orderDate: new Date().toISOString().split("T")[0],
    paymentTerm: "",
    dueOn: "",
    brokerName: "",
    // IRN
    irn: "",
    // Billed To
    billedToName: "",
    billedToAddress: "",
    billedToState: "",
    billedToGSTIN: "",
    billedToPANo: "",
    // Transporter
    transporterName: "",
    lrNo: "",
    lrDate: "",
    vehicleNo: "",
    placeOfSupply: "",
    from: "",
    to: "",
    noOfBoxes: "",
    // ACK
    ackNo: "",
    // Shipped To
    shippedToName: "",
    shippedToAddress: "",
    shippedToState: "",
    shippedToGSTIN: "",
    shippedToPANo: "",
    // Tax settings
    discountEnabled: false,
    discountRate: 0,
    transportChargesEnabled: false,
    transportCharges: 0,
    igstEnabled: false,
    igstRate: 18,
    sgstEnabled: false,
    sgstRate: 9,
    cgstEnabled: false,
    cgstRate: 9,
    // Bank Details
    bankDetails: "",
    branch: "",
    rtgsNeftIfscCode: "",
    // Terms
    termsAndConditions: DEFAULT_TERMS,
    // Signature
    signatureBy: "",
    signatureDate: new Date().toISOString().split("T")[0],
    // Footer Section
    footerGSTIN: "19AZEPR3832Q1ZL",
    footerPANo: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as any;
    const finalValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : name.includes("Rate")
        ? parseFloat(value)
        : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      toast.success("Item deleted");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || !items[0].productId) {
      toast.error("Add at least one product to the invoice");
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const adjustedTotal = Math.floor(Math.abs(totals.total));
      const response = await api.post("/invoices", {
        ...formData,
        items,
        adjustedTotal,
      });
      setCreatedInvoiceId(response.data.id);
      toast.success("Invoice created successfully");
      // Reset form
      setFormData({
        taxInvNo: "",
        taxInvDate: new Date().toISOString().split("T")[0],
        chalanNo: "",
        chalanDate: "",
        orderNo: "",
        orderDate: new Date().toISOString().split("T")[0],
        paymentTerm: "",
        dueOn: "",
        brokerName: "",
        irn: "",
        billedToName: "",
        billedToAddress: "",
        billedToState: "",
        billedToGSTIN: "",
        billedToPANo: "",
        transporterName: "",
        lrNo: "",
        lrDate: "",
        vehicleNo: "",
        placeOfSupply: "",
        from: "",
        to: "",
        noOfBoxes: "",
        ackNo: "",
        shippedToName: "",
        shippedToAddress: "",
        shippedToState: "",
        shippedToGSTIN: "",
        shippedToPANo: "",
        discountEnabled: false,
        discountRate: 0,
        transportChargesEnabled: false,
        transportCharges: 0,
        igstEnabled: false,
        igstRate: 18,
        sgstEnabled: false,
        sgstRate: 9,
        cgstEnabled: false,
        cgstRate: 9,
        bankDetails: "",
        branch: "",
        rtgsNeftIfscCode: "",
        termsAndConditions: DEFAULT_TERMS,
        signatureBy: "",
        signatureDate: new Date().toISOString().split("T")[0],
        footerGSTIN: "19AZEPR3832Q1ZL",
        footerPANo: "",
      });
      if (onSuccess) onSuccess();
      setItems([{ productId: "", quantity: 1 }]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create invoice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!createdInvoiceId) return;
    const link = document.createElement("a");
    link.href = `/api/invoices/${createdInvoiceId}/pdf`;
    link.download = `invoice-${createdInvoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const price = item.price || product.price;
        subtotal += price * item.quantity;
      }
    });

    const discountAmount = formData.discountEnabled
      ? (subtotal * formData.discountRate) / 100
      : 0;
    const subtotalAfterDiscount = subtotal - discountAmount;

    const transportCharges = formData.transportChargesEnabled
      ? parseFloat(String(formData.transportCharges)) || 0
      : 0;

    const sgstAmount = formData.sgstEnabled
      ? ((subtotalAfterDiscount + transportCharges) * formData.sgstRate) / 100
      : 0;
    const cgstAmount = formData.cgstEnabled
      ? ((subtotalAfterDiscount + transportCharges) * formData.cgstRate) / 100
      : 0;
    const igstAmount = formData.igstEnabled
      ? ((subtotalAfterDiscount + transportCharges) * formData.igstRate) / 100
      : 0;

    const subtotalAfterTransport = subtotalAfterDiscount + transportCharges;
    const subtotalAfterTaxes =
      subtotalAfterTransport + sgstAmount + cgstAmount + igstAmount;

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      transportCharges,
      subtotalAfterTransport,
      sgstAmount,
      cgstAmount,
      igstAmount,
      subtotalAfterTaxes,
      total: subtotalAfterTaxes,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Tax Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* LEFT AND RIGHT COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-4">
                {/* TAX INVOICE DETAILS BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Tax Inv No.</Label>
                      <Input
                        name="taxInvNo"
                        value={formData.taxInvNo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Tax Invoice No."
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Date</Label>
                      <Input
                        name="taxInvDate"
                        type="date"
                        value={formData.taxInvDate}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Chalan No.</Label>
                      <Input
                        name="chalanNo"
                        value={formData.chalanNo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Chalan No."
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Date</Label>
                      <Input
                        name="chalanDate"
                        type="date"
                        value={formData.chalanDate}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Order No.</Label>
                      <Input
                        name="orderNo"
                        value={formData.orderNo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Order No."
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Order Date</Label>
                      <Input
                        name="orderDate"
                        type="date"
                        value={formData.orderDate}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Payment Term</Label>
                      <Input
                        name="paymentTerm"
                        value={formData.paymentTerm}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Payment Term"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Due On</Label>
                      <Input
                        name="dueOn"
                        type="date"
                        value={formData.dueOn}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Broker Name</Label>
                    <Input
                      name="brokerName"
                      value={formData.brokerName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Broker Name"
                    />
                  </div>
                </div>

                {/* IRN FIELD */}
                <div className="border-2 border-gray-400 p-3 rounded space-y-1">
                  <div>
                    <Label className="text-xs block mb-1">IRN</Label>
                    <Input
                      name="irn"
                      value={formData.irn}
                      onChange={handleInputChange}
                      placeholder="IRN Code"
                      className="text-sm h-8"
                    />
                  </div>
                </div>

                {/* BILLED TO BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-1">
                  <div>
                    <Label className="text-xs block mb-1">Billed To</Label>
                    <Input
                      name="billedToName"
                      value={formData.billedToName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Address</Label>
                    <Textarea
                      name="billedToAddress"
                      value={formData.billedToAddress}
                      onChange={handleInputChange}
                      placeholder="Address (3-4 lines)"
                      className="text-sm min-h-[60px] resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">State</Label>
                    <Input
                      name="billedToState"
                      value={formData.billedToState}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">GSTIN</Label>
                      <Input
                        name="billedToGSTIN"
                        value={formData.billedToGSTIN}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="GSTIN"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">P.A. No.</Label>
                      <Input
                        name="billedToPANo"
                        value={formData.billedToPANo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="P.A. No."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-4">
                {/* TRANSPORTER BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-1">
                  <div>
                    <Label className="text-xs block mb-1">Transporter</Label>
                    <Input
                      name="transporterName"
                      value={formData.transporterName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Transporter Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">L.R. No.</Label>
                      <Input
                        name="lrNo"
                        value={formData.lrNo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="L.R. No."
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Date</Label>
                      <Input
                        name="lrDate"
                        type="date"
                        value={formData.lrDate}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Vehicle No.</Label>
                    <Input
                      name="vehicleNo"
                      value={formData.vehicleNo}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Vehicle No."
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">
                      Place of Supply
                    </Label>
                    <Input
                      name="placeOfSupply"
                      value={formData.placeOfSupply}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Place of Supply"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">From</Label>
                      <Input
                        name="from"
                        value={formData.from}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="From"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">To</Label>
                      <Input
                        name="to"
                        value={formData.to}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="To"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">No. of Boxes</Label>
                    <Input
                      name="noOfBoxes"
                      value={formData.noOfBoxes}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="No. of Boxes"
                    />
                  </div>
                </div>

                {/* ACK NO FIELD */}
                <div className="border-2 border-gray-400 p-3 rounded space-y-1">
                  <div>
                    <Label className="text-xs block mb-1">ACK No.</Label>
                    <Input
                      name="ackNo"
                      value={formData.ackNo}
                      onChange={handleInputChange}
                      placeholder="ACK Code"
                      className="text-sm h-8"
                    />
                  </div>
                </div>

                {/* SHIPPED TO BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-1">
                  <div>
                    <Label className="text-xs block mb-1">Shipped To</Label>
                    <Input
                      name="shippedToName"
                      value={formData.shippedToName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Address</Label>
                    <Textarea
                      name="shippedToAddress"
                      value={formData.shippedToAddress}
                      onChange={handleInputChange}
                      placeholder="Address (3-4 lines)"
                      className="text-sm min-h-[60px] resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">State</Label>
                    <Input
                      name="shippedToState"
                      value={formData.shippedToState}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">GSTIN</Label>
                      <Input
                        name="shippedToGSTIN"
                        value={formData.shippedToGSTIN}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="GSTIN"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">P.A. No.</Label>
                      <Input
                        name="shippedToPANo"
                        value={formData.shippedToPANo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="P.A. No."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT DETAILS TABLE */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="border-r px-3 py-2 text-left">S.No</th>
                      <th className="border-r px-3 py-2 text-left">
                        Description of Goods
                      </th>
                      <th className="border-r px-3 py-2 text-left">
                        HSN/SAC Code
                      </th>
                      <th className="border-r px-3 py-2 text-center">
                        Quantity
                      </th>
                      <th className="border-r px-3 py-2 text-center">Rate</th>
                      <th className="border-r px-3 py-2 text-center">Per</th>
                      <th className="border-r px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const product = products.find(
                        (p) => p.id === item.productId
                      );
                      const amount =
                        (item.price || product?.price || 0) * item.quantity;
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="border-r px-3 py-2">{index + 1}</td>
                          <td className="border-r px-3 py-2">
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "productId",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value="">Select product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="text"
                              value={item.hsnCode || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "hsnCode",
                                  e.target.value
                                )
                              }
                              className="text-sm h-8"
                              placeholder="HSN Code"
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value)
                                )
                              }
                              className="text-sm h-8"
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || undefined
                                )
                              }
                              className="text-sm h-8"
                              placeholder={product?.price.toString()}
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="text"
                              value={item.per || ""}
                              onChange={(e) =>
                                handleItemChange(index, "per", e.target.value)
                              }
                              className="text-sm h-8"
                              placeholder={product?.unit || "pcs"}
                            />
                          </td>
                          <td className="border-r px-3 py-2 text-right font-semibold">
                            ₹{amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={items.length === 1}
                              title={
                                items.length === 1
                                  ? "Cannot delete the last item"
                                  : "Delete row"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* TAX & DISCOUNT SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Discount */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="discountEnabled"
                    name="discountEnabled"
                    checked={formData.discountEnabled}
                    onChange={handleInputChange}
                  />
                  <Label
                    htmlFor="discountEnabled"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    Discount
                  </Label>
                </div>
                {formData.discountEnabled && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      name="discountRate"
                      value={formData.discountRate}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Transport Charges */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="transportChargesEnabled"
                    name="transportChargesEnabled"
                    checked={formData.transportChargesEnabled}
                    onChange={handleInputChange}
                  />
                  <Label
                    htmlFor="transportChargesEnabled"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    Transport
                  </Label>
                </div>
                {formData.transportChargesEnabled && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      name="transportCharges"
                      value={formData.transportCharges}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* IGST */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="igstEnabled"
                    name="igstEnabled"
                    checked={formData.igstEnabled}
                    onChange={handleInputChange}
                  />
                  <Label
                    htmlFor="igstEnabled"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    IGST
                  </Label>
                </div>
                {formData.igstEnabled && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      name="igstRate"
                      value={formData.igstRate}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="18"
                    />
                  </div>
                )}
              </div>

              {/* SGST */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sgstEnabled"
                    name="sgstEnabled"
                    checked={formData.sgstEnabled}
                    onChange={handleInputChange}
                  />
                  <Label
                    htmlFor="sgstEnabled"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    SGST
                  </Label>
                </div>
                {formData.sgstEnabled && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      name="sgstRate"
                      value={formData.sgstRate}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="9"
                    />
                  </div>
                )}
              </div>

              {/* CGST */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cgstEnabled"
                    name="cgstEnabled"
                    checked={formData.cgstEnabled}
                    onChange={handleInputChange}
                  />
                  <Label
                    htmlFor="cgstEnabled"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    CGST
                  </Label>
                </div>
                {formData.cgstEnabled && (
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      name="cgstRate"
                      value={formData.cgstRate}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="9"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* TOTALS SUMMARY */}
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="max-w-md ml-auto space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      ₹{totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-orange-600">
                        <span>Discount ({formData.discountRate}%):</span>
                        <span className="font-semibold">
                          -₹{totals.discountAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Subtotal After Discount:</span>
                        <span>₹{totals.subtotalAfterDiscount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {totals.transportCharges > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Transport Charges:</span>
                        <span className="font-semibold">
                          ₹{totals.transportCharges.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Subtotal After Transport:</span>
                        <span>₹{totals.subtotalAfterTransport.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {totals.igstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>IGST ({formData.igstRate}%):</span>
                      <span className="font-semibold">
                        ₹{totals.igstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {totals.sgstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>SGST ({formData.sgstRate}%):</span>
                      <span className="font-semibold">
                        ₹{totals.sgstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {totals.cgstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>CGST ({formData.cgstRate}%):</span>
                      <span className="font-semibold">
                        ₹{totals.cgstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(totals.sgstAmount > 0 ||
                    totals.cgstAmount > 0 ||
                    totals.igstAmount > 0) && (
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Subtotal After Taxes:</span>
                      <span>₹{totals.subtotalAfterTaxes.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-blue-600">
                    <span>Adjusted Total:</span>
                    <span className="font-semibold">
                      ₹{Math.floor(Math.abs(totals.total)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 font-bold flex justify-between text-base">
                    <span>Total Amount:</span>
                    <span>
                      ₹{Math.floor(Math.abs(totals.total)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BANK DETAILS */}
            <div className="border-2 border-gray-400 p-4 rounded space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Bank Details</Label>
                  <Textarea
                    name="bankDetails"
                    value={formData.bankDetails}
                    onChange={handleInputChange}
                    placeholder="Bank name, account number, etc."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <Label className="text-sm">Branch</Label>
                    <Input
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      placeholder="Branch name"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">RTGS/NEFT/IFSC Code</Label>
                    <Input
                      name="rtgsNeftIfscCode"
                      value={formData.rtgsNeftIfscCode}
                      onChange={handleInputChange}
                      placeholder="IFSC Code"
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER SECTION */}
            <div className="border-2 border-gray-400 p-4 rounded space-y-4">
              <h3 className="text-lg font-semibold">Invoice Footer</h3>

              {/* GSTIN and P.A.No */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 bg-gray-50 rounded border">
                <div>
                  <Label className="text-sm font-semibold">GSTIN</Label>
                  <Input
                    name="footerGSTIN"
                    value={formData.footerGSTIN}
                    onChange={handleInputChange}
                    placeholder="GSTIN"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">P.A. No.</Label>
                  <Input
                    name="footerPANo"
                    value={formData.footerPANo}
                    onChange={handleInputChange}
                    placeholder="P.A. No."
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              {/* TERMS & CONDITIONS */}
              <div>
                <Label className="text-sm font-semibold">
                  Terms & Conditions
                </Label>
                <Textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleInputChange}
                  className="min-h-[100px] terms-textarea text-sm"
                />
              </div>

              {/* DIGITALLY SIGNED BY */}
              <div>
                <Label className="text-sm font-semibold">
                  Digitally Signed By
                </Label>
                <Input
                  name="signatureBy"
                  value={formData.signatureBy}
                  onChange={handleInputChange}
                  placeholder="Enter name of person signing digitally"
                  className="h-9 text-sm"
                />
              </div>
              </div>

            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Creating Invoice..." : "Create Invoice"}
            </Button>
          </form>

          {createdInvoiceId && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">
                  Invoice created successfully!
                </p>
                <p className="text-sm text-green-700">
                  Invoice ID: {createdInvoiceId}
                </p>
              </div>
              <Button onClick={downloadPDF} className="gap-2" variant="default">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
