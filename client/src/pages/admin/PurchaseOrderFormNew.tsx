import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Download, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  unit: string;
  stock: number;
}

interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  rate?: number;
  itemDescription?: string;
  hsnCode?: string;
  discount?: number;
  per?: string;
}

const DEFAULT_TERMS = `1. All Led Bulbs Should Come With B22 Cap.
2. The Warranty Period Of The Products Will Begin From The Date On Which The Shipment Gets Delivered To The Shipping Address.
3. The Warranty Of The "Led Bulbs" (Sl No. 1-4) Will Be 1 Year 3 Months.
4. The Warranty Of The "Dob Ultra Slim Backlit Panels" (Sl No. 5-12) Will Be 2 Years 3 Months.
5. During The Warranty Period Of The Products, If In Any Product Defect/Damage Is Observed, It Is Required To Be Replaced With A New Product In The Same/Similar Category Or The Original Amount Of The Product Should Be Refunded By You Side.
6. If Misprint Is Found In Any Product/Product Box It Will Not Be Accepted By Us, Refund Should Be Done With Immediate Effect From Your Side.
7. TRANSIT INSURANCE: To Be Covered By You/Us, Please Inform Dispatch Particular Via Call/Mail Immediately.
8. All Disputes Are Subject To Howrah Jurisdiction.`;

export default function PurchaseOrderFormNew({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdPOId, setCreatedPOId] = useState<string | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { productId: '', quantity: 1 },
  ]);

  const [formData, setFormData] = useState({
    // Purchase Order Details
    poDate: new Date().toISOString().split('T')[0],
    gstNo: '',
    
    // Shipment Address
    shipmentName: 'M/S ROY ENTERPRISE',
    shipmentAddress: '37/2, Kamini School Lane, Salkia, Howrah - 711106',
    shipmentState: 'West Bengal',
    shipmentPhone: '(+91) 9831061571',
    
    // Vendor Address
    supplierName: '',
    supplierAddress: '',
    supplierState: '',
    supplierGSTNo: '',
    supplierPhone: '',
    supplierEmail: '',
    supplierContactPerson: '',
    
    // Tax settings
    discountEnabled: false,
    discountRate: 0,
    igstEnabled: false,
    igstRate: 18,
    cgstEnabled: true,
    cgstRate: 9,
    sgstEnabled: true,
    sgstRate: 9,
    
    // Payment & Delivery
    paymentTerms: '30% ADVANCE ALONGWITH ORDER WITHIN 7 BUSINESS DAYS & BALANCE AMOUNT BEFORE DELIVERY.',
    delivery: 'WITHIN 3 MONTHS FROM THE DATE OF PO.',
    
    // Terms
    termsAndConditions: DEFAULT_TERMS,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                       name.includes('Rate') ? parseFloat(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      toast.success('Item deleted');
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || !items[0].productId) {
      toast.error('Add at least one product to the purchase order');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/purchase-orders/form', { ...formData, items });
      setCreatedPOId(response.data.id);
      toast.success('Purchase order created successfully');
      // Reset form
      setFormData({
        poDate: new Date().toISOString().split('T')[0],
        gstNo: '',
        shipmentName: 'M/S ROY ENTERPRISE',
        shipmentAddress: '37/2, Kamini School Lane, Salkia, Howrah - 711106',
        shipmentState: 'West Bengal',
        shipmentPhone: '(+91) 9831061571',
        supplierName: '',
        supplierAddress: '',
        supplierState: '',
        supplierGSTNo: '',
        supplierPhone: '',
        supplierEmail: '',
        supplierContactPerson: '',
        discountEnabled: false,
        discountRate: 0,
        igstEnabled: false,
        igstRate: 18,
        cgstEnabled: true,
        cgstRate: 9,
        sgstEnabled: true,
        sgstRate: 9,
        paymentTerms: '30% ADVANCE ALONGWITH ORDER WITHIN 7 BUSINESS DAYS & BALANCE AMOUNT BEFORE DELIVERY.',
        delivery: 'WITHIN 3 MONTHS FROM THE DATE OF PO.',
        termsAndConditions: DEFAULT_TERMS,
      });
      if (onSuccess) onSuccess();
      setItems([{ productId: '', quantity: 1 }]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create purchase order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!createdPOId) return;
    const link = document.createElement('a');
    link.href = `/api/purchase-orders/${createdPOId}/pdf`;
    link.download = `po-${createdPOId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const rate = item.rate || product.cost;
        const discount = item.discount || 0;
        const value = (rate * item.quantity) - ((rate * item.quantity * discount) / 100);
        subtotal += value;
      }
    });

    const discountAmount = formData.discountEnabled ? (subtotal * formData.discountRate) / 100 : 0;
    const subtotalAfterDiscount = subtotal - discountAmount;

    const igstAmount = formData.igstEnabled ? (subtotalAfterDiscount * formData.igstRate) / 100 : 0;
    const sgstAmount = formData.sgstEnabled ? (subtotalAfterDiscount * formData.sgstRate) / 100 : 0;
    const cgstAmount = formData.cgstEnabled ? (subtotalAfterDiscount * formData.cgstRate) / 100 : 0;

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      igstAmount,
      sgstAmount,
      cgstAmount,
      total: subtotalAfterDiscount + igstAmount + sgstAmount + cgstAmount,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* LEFT AND RIGHT COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-4">
                {/* PURCHASE ORDER DETAILS BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Purchase Order No.</Label>
                      <Input
                        name="orderNumber"
                        disabled
                        value="Auto-generated"
                        className="text-sm h-8 bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">PO Date</Label>
                      <Input
                        name="poDate"
                        type="date"
                        value={formData.poDate}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">GST NO.</Label>
                    <Input
                      name="gstNo"
                      value={formData.gstNo}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="19AZEPR3832Q1ZL"
                    />
                  </div>
                </div>

                {/* SHIPMENT ADDRESS BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-2">
                  <Label className="font-semibold text-sm">SHIPMENT ADDRESS</Label>
                  <div>
                    <Label className="text-xs block mb-1">Company Name</Label>
                    <Input
                      name="shipmentName"
                      value={formData.shipmentName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Address</Label>
                    <Textarea
                      name="shipmentAddress"
                      value={formData.shipmentAddress}
                      onChange={handleInputChange}
                      placeholder="Address (3-4 lines)"
                      className="text-sm min-h-[60px] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">State</Label>
                      <Input
                        name="shipmentState"
                        value={formData.shipmentState}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Phone</Label>
                      <Input
                        name="shipmentPhone"
                        value={formData.shipmentPhone}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-4">
                {/* VENDOR ADDRESS BOX */}
                <div className="border-2 border-gray-400 p-3 rounded flex-1 space-y-2">
                  <Label className="font-semibold text-sm">VENDOR ADDRESS</Label>
                  <div>
                    <Label className="text-xs block mb-1">Supplier Name</Label>
                    <Input
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Supplier Name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Address</Label>
                    <Textarea
                      name="supplierAddress"
                      value={formData.supplierAddress}
                      onChange={handleInputChange}
                      placeholder="Address"
                      className="text-sm min-h-[60px] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">State</Label>
                      <Input
                        name="supplierState"
                        value={formData.supplierState}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">GST NO.</Label>
                      <Input
                        name="supplierGSTNo"
                        value={formData.supplierGSTNo}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="GST NO."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs block mb-1">Phone No.</Label>
                      <Input
                        name="supplierPhone"
                        value={formData.supplierPhone}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <Label className="text-xs block mb-1">Email</Label>
                      <Input
                        name="supplierEmail"
                        type="email"
                        value={formData.supplierEmail}
                        onChange={handleInputChange}
                        className="text-sm h-8"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Contact Person</Label>
                    <Input
                      name="supplierContactPerson"
                      value={formData.supplierContactPerson}
                      onChange={handleInputChange}
                      className="text-sm h-8"
                      placeholder="Contact Person"
                    />
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
                      <th className="border-r px-3 py-2 text-left">Item Description</th>
                      <th className="border-r px-3 py-2 text-left">HSN Code</th>
                      <th className="border-r px-3 py-2 text-center">Quantity</th>
                      <th className="border-r px-3 py-2 text-center">Discount %</th>
                      <th className="border-r px-3 py-2 text-center">Rate/Unit</th>
                      <th className="border-r px-3 py-2 text-right">Value</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      const rate = item.rate || product?.cost || 0;
                      const discount = item.discount || 0;
                      const value = (rate * item.quantity) - ((rate * item.quantity * discount) / 100);
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="border-r px-3 py-2">{index + 1}</td>
                          <td className="border-r px-3 py-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
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
                              value={item.hsnCode || ''}
                              onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                              className="text-sm h-8"
                              placeholder="HSN Code"
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="text-sm h-8"
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount || 0}
                              onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                              className="text-sm h-8"
                              placeholder="0"
                            />
                          </td>
                          <td className="border-r px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate || ''}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || undefined)}
                              className="text-sm h-8"
                              placeholder={product?.cost.toString()}
                            />
                          </td>
                          <td className="border-r px-3 py-2 text-right font-semibold">₹{value.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={items.length === 1}
                              title={items.length === 1 ? "Cannot delete the last item" : "Delete row"}
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
                  <Label htmlFor="discountEnabled" className="font-semibold text-sm cursor-pointer">Discount</Label>
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

              {/* IGST */}
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="igstEnabled"
                    name="igstEnabled"
                    checked={formData.igstEnabled}
                    onChange={handleInputChange}
                  />
                  <Label htmlFor="igstEnabled" className="font-semibold text-sm cursor-pointer">IGST</Label>
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
                  <Label htmlFor="sgstEnabled" className="font-semibold text-sm cursor-pointer">SGST</Label>
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
                  <Label htmlFor="cgstEnabled" className="font-semibold text-sm cursor-pointer">CGST</Label>
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
                    <span>Total:</span>
                    <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Discount ({formData.discountRate}%):</span>
                      <span className="font-semibold">-₹{totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>After Discount:</span>
                      <span>₹{totals.subtotalAfterDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.igstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>IGST ({formData.igstRate}%):</span>
                      <span className="font-semibold">₹{totals.igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.sgstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>SGST ({formData.sgstRate}%):</span>
                      <span className="font-semibold">₹{totals.sgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.cgstAmount > 0 && (
                    <div className="flex justify-between">
                      <span>CGST ({formData.cgstRate}%):</span>
                      <span className="font-semibold">₹{totals.cgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-bold flex justify-between text-base">
                    <span>Net PO Amount:</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT & DELIVERY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Payment Terms</Label>
                <Textarea
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Delivery</Label>
                <Textarea
                  name="delivery"
                  value={formData.delivery}
                  onChange={handleInputChange}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Special Terms and Conditions</h3>
              <Textarea
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleInputChange}
                className="min-h-[200px]"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? 'Creating Purchase Order...' : 'Create Purchase Order'}
            </Button>
          </form>

          {createdPOId && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">Purchase order created successfully!</p>
                <p className="text-sm text-green-700">PO ID: {createdPOId}</p>
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
