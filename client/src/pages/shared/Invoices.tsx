import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Plus, Eye, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import InvoiceFormNew from '../admin/InvoiceFormNew'

export default function Invoices() {
  const [isOpen, setIsOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices')
      return res.data
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/invoices', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setIsOpen(false)
      toast.success('Invoice created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create invoice')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invoices/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Invoice deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete invoice')
    },
  })



  const downloadInvoicePDF = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
  }

  const getProductPrice = (productId: string) => {
    return products?.find((p: any) => p.id === productId)?.price || 0
  }

  // Filter invoices based on active tab
  const displayedInvoices = useMemo(() => {
    if (!invoices) return []
    if (user?.role === 'EMPLOYEE') {
      return invoices.filter((inv: any) => inv.userId === user.id)
    }
    // Admin: filter based on active tab
    if (activeTab === 'my') {
      return invoices.filter((inv: any) => inv.userId === user?.id)
    }
    return invoices
  }, [invoices, activeTab, user])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {user?.role === 'ADMIN' ? 'Manage all invoices' : 'Your invoices'}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
        <Button className="h-10 bg-emerald-600 hover:bg-emerald-700">
        <Plus className="h-4 w-4 mr-2" />
        Create Invoice
        </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
        <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
        <InvoiceFormNew onSuccess={() => setIsOpen(false)} />
        </div>
        </DialogContent>
        </Dialog>
      </div>

      {user?.role === 'ADMIN' ? (
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')} className="space-y-6">
      <TabsList className="bg-gray-100 border-2 border-gray-200 rounded-xl p-1 h-auto">
      <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">All Invoices</TabsTrigger>
      <TabsTrigger value="my" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">My Invoices</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="space-y-4">
      <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="h-1.5 w-full bg-emerald-500"></div>
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-lg font-bold">All Invoices</CardTitle>
               </CardHeader>
              <CardContent className="pt-6">
                <Table>
                <TableHeader>
                   <TableRow>
                     <TableHead>Invoice Number</TableHead>
                     <TableHead>Employee</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {invoices?.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                         No invoices found
                       </TableCell>
                     </TableRow>
                   ) : (
                     invoices?.map((invoice: any) => (
                       <TableRow key={invoice.id}>
                         <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                         <TableCell>{invoice.user?.name}</TableCell>
                         <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewInvoice(invoice)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoicePDF(invoice.id)}
                        title="Download PDF"
                        >
                        <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                            size="sm"
                              onClick={() => {
                                  if (confirm('Are you sure you want to delete this invoice?')) {
                                      deleteMutation.mutate(invoice.id)
                                      }
                                      }}
                                   >
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                          </Table>
                           </CardContent>
                         </Card>
                        </TabsContent>
                        <TabsContent value="my" className="space-y-4">
                        <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                        <div className="h-1.5 w-full bg-emerald-500"></div>
                        <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg font-bold">My Invoices</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                        <Table>
                        <TableHeader>
                        <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {displayedInvoices.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No invoices found
                        </TableCell>
                        </TableRow>
                        ) : (
                        displayedInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                        {invoice.status}
                        </span>
                        </TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewInvoice(invoice)}
                        title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                              size="sm"
                                onClick={() => downloadInvoicePDF(invoice.id)}
                                  title="Download PDF"
                                  >
                                      <Download className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                    size="sm"
                               onClick={() => {
                                 if (confirm('Are you sure you want to delete this invoice?')) {
                                   deleteMutation.mutate(invoice.id)
                                 }
                               }}
                             >
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
                  </Table>
                  </CardContent>
                  </Card>
                   </TabsContent>
                  </Tabs>
                ) : (
                <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <div className="h-1.5 w-full bg-emerald-500"></div>
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-lg font-bold">Invoices</CardTitle>
           </CardHeader>
          <CardContent className="pt-6">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                displayedInvoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewInvoice(invoice)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadInvoicePDF(invoice.id)}
                    title="Download PDF"
                    >
                    <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                        size="sm"
                          onClick={() => {
                              if (confirm('Are you sure you want to delete this invoice?')) {
                                  deleteMutation.mutate(invoice.id)
                                  }
                                  }}
                               >
                                 <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                                   </div>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
              </Table>
              </CardContent>
              </Card>
        )}

       {viewInvoice && (
         <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Invoice Details</DialogTitle>
               <DialogDescription>Invoice #{viewInvoice.invoiceNumber}</DialogDescription>
             </DialogHeader>
             <div className="space-y-6">
               {/* Basic Info */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label>Invoice Number</Label>
                   <p className="font-medium">{viewInvoice.invoiceNumber}</p>
                 </div>
                 <div>
                   <Label>Status</Label>
                   <p className="capitalize">{viewInvoice.status}</p>
                 </div>
                 <div>
                   <Label>Created By</Label>
                   <p>{viewInvoice.user?.name}</p>
                 </div>
                 <div>
                   <Label>Date</Label>
                   <p>{formatDate(viewInvoice.createdAt)}</p>
                 </div>
               </div>

               {/* Tax Invoice Details */}
               <div className="border rounded-lg p-4 space-y-3">
                 <h3 className="font-semibold">Tax Invoice Details</h3>
                 <div className="grid grid-cols-2 gap-3 text-sm">
                   <div>
                     <Label>Tax Invoice No.</Label>
                     <p>{viewInvoice.taxInvNo || '-'}</p>
                   </div>
                   <div>
                     <Label>Tax Invoice Date</Label>
                     <p>{viewInvoice.taxInvDate ? formatDate(viewInvoice.taxInvDate) : '-'}</p>
                   </div>
                   <div>
                     <Label>Chalan No.</Label>
                     <p>{viewInvoice.chalanNo || '-'}</p>
                   </div>
                   <div>
                     <Label>Chalan Date</Label>
                     <p>{viewInvoice.chalanDate ? formatDate(viewInvoice.chalanDate) : '-'}</p>
                   </div>
                   <div>
                     <Label>Order No.</Label>
                     <p>{viewInvoice.orderNo || '-'}</p>
                   </div>
                   <div>
                     <Label>Order Date</Label>
                     <p>{viewInvoice.orderDate ? formatDate(viewInvoice.orderDate) : '-'}</p>
                   </div>
                   <div>
                     <Label>Payment Term</Label>
                     <p>{viewInvoice.paymentTerm || '-'}</p>
                   </div>
                   <div>
                     <Label>Due On</Label>
                     <p>{viewInvoice.dueOn ? formatDate(viewInvoice.dueOn) : '-'}</p>
                   </div>
                   <div className="col-span-2">
                     <Label>Broker Name</Label>
                     <p>{viewInvoice.brokerName || '-'}</p>
                   </div>
                 </div>
               </div>

               {/* Transporter Details */}
               <div className="border rounded-lg p-4 space-y-3">
                 <h3 className="font-semibold">Transporter Details</h3>
                 <div className="grid grid-cols-2 gap-3 text-sm">
                   <div className="col-span-2">
                     <Label>Transporter Name</Label>
                     <p>{viewInvoice.transporterName || '-'}</p>
                   </div>
                   <div>
                     <Label>L.R. No.</Label>
                     <p>{viewInvoice.lrNo || '-'}</p>
                   </div>
                   <div>
                     <Label>L.R. Date</Label>
                     <p>{viewInvoice.lrDate ? formatDate(viewInvoice.lrDate) : '-'}</p>
                   </div>
                   <div>
                     <Label>Vehicle No.</Label>
                     <p>{viewInvoice.vehicleNo || '-'}</p>
                   </div>
                   <div>
                     <Label>Place of Supply</Label>
                     <p>{viewInvoice.placeOfSupply || '-'}</p>
                   </div>
                   <div>
                     <Label>From</Label>
                     <p>{viewInvoice.from || '-'}</p>
                   </div>
                   <div>
                     <Label>To</Label>
                     <p>{viewInvoice.to || '-'}</p>
                   </div>
                   <div>
                     <Label>No. of Boxes</Label>
                     <p>{viewInvoice.noOfBoxes || '-'}</p>
                   </div>
                 </div>
               </div>

               {/* IRN and ACK */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="border rounded-lg p-4">
                   <Label>IRN</Label>
                   <p>{viewInvoice.irn || '-'}</p>
                 </div>
                 <div className="border rounded-lg p-4">
                   <Label>ACK No.</Label>
                   <p>{viewInvoice.ackNo || '-'}</p>
                 </div>
               </div>

               {/* Billed To and Shipped To */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="border rounded-lg p-4 space-y-2 text-sm">
                   <h3 className="font-semibold">Billed To</h3>
                   <div>
                     <Label>Name</Label>
                     <p>{viewInvoice.billedToName || '-'}</p>
                   </div>
                   <div>
                     <Label>Address</Label>
                     <p className="whitespace-pre-wrap">{viewInvoice.billedToAddress || '-'}</p>
                   </div>
                   <div>
                     <Label>State</Label>
                     <p>{viewInvoice.billedToState || '-'}</p>
                   </div>
                   <div>
                     <Label>GSTIN</Label>
                     <p>{viewInvoice.billedToGSTIN || '-'}</p>
                   </div>
                   <div>
                     <Label>P.A. No.</Label>
                     <p>{viewInvoice.billedToPANo || '-'}</p>
                   </div>
                 </div>

                 <div className="border rounded-lg p-4 space-y-2 text-sm">
                   <h3 className="font-semibold">Shipped To</h3>
                   <div>
                     <Label>Name</Label>
                     <p>{viewInvoice.shippedToName || '-'}</p>
                   </div>
                   <div>
                     <Label>Address</Label>
                     <p className="whitespace-pre-wrap">{viewInvoice.shippedToAddress || '-'}</p>
                   </div>
                   <div>
                     <Label>State</Label>
                     <p>{viewInvoice.shippedToState || '-'}</p>
                   </div>
                   <div>
                     <Label>GSTIN</Label>
                     <p>{viewInvoice.shippedToGSTIN || '-'}</p>
                   </div>
                   <div>
                     <Label>P.A. No.</Label>
                     <p>{viewInvoice.shippedToPANo || '-'}</p>
                   </div>
                 </div>
               </div>

               {/* Items */}
               <div>
                 <Label className="text-base font-semibold">Items</Label>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>S.No</TableHead>
                       <TableHead>Description</TableHead>
                       <TableHead>HSN/SAC Code</TableHead>
                       <TableHead className="text-center">Quantity</TableHead>
                       <TableHead className="text-right">Price</TableHead>
                       <TableHead className="text-center">Per</TableHead>
                       <TableHead className="text-right">Amount</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {viewInvoice.items?.map((item: any, idx: number) => (
                       <TableRow key={item.id}>
                         <TableCell>{idx + 1}</TableCell>
                         <TableCell>{item.description || item.product?.name}</TableCell>
                         <TableCell>{item.hsnCode || '-'}</TableCell>
                         <TableCell className="text-center">{item.quantity}</TableCell>
                         <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                         <TableCell className="text-center">{item.per || item.product?.unit}</TableCell>
                         <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

               {/* Tax Summary */}
               <div className="grid grid-cols-2 gap-4">
                 <div />
                 <div className="border rounded-lg p-4 space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span>Subtotal:</span>
                     <span className="font-medium">{formatCurrency(viewInvoice.totalAmount)}</span>
                   </div>
                   {viewInvoice.discountAmount > 0 && (
                     <div className="flex justify-between text-orange-600">
                       <span>Discount ({viewInvoice.discountRate}%):</span>
                       <span>-{formatCurrency(viewInvoice.discountAmount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between border-t pt-2">
                     <span>After Discount:</span>
                     <span className="font-medium">{formatCurrency(viewInvoice.totalAmount - viewInvoice.discountAmount)}</span>
                   </div>
                   {viewInvoice.sgstAmount > 0 && (
                     <div className="flex justify-between">
                       <span>SGST ({viewInvoice.sgstRate}%):</span>
                       <span>{formatCurrency(viewInvoice.sgstAmount)}</span>
                     </div>
                   )}
                   {viewInvoice.cgstAmount > 0 && (
                     <div className="flex justify-between">
                       <span>CGST ({viewInvoice.cgstRate}%):</span>
                       <span>{formatCurrency(viewInvoice.cgstAmount)}</span>
                     </div>
                   )}
                   {viewInvoice.igstAmount > 0 && (
                     <div className="flex justify-between">
                       <span>IGST ({viewInvoice.igstRate}%):</span>
                       <span>{formatCurrency(viewInvoice.igstAmount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between font-bold border-t pt-2 text-base">
                     <span>Total Amount:</span>
                     <span>{formatCurrency(viewInvoice.netAmount)}</span>
                   </div>
                 </div>
               </div>

               {/* Bank Details */}
               {(viewInvoice.bankDetails || viewInvoice.branch || viewInvoice.rtgsNeftIfscCode) && (
                 <div className="border rounded-lg p-4 space-y-3">
                   <h3 className="font-semibold">Bank Details</h3>
                   <div className="grid grid-cols-2 gap-3 text-sm">
                     {viewInvoice.bankDetails && (
                       <div className="col-span-2">
                         <Label>Bank Details</Label>
                         <p className="whitespace-pre-wrap">{viewInvoice.bankDetails}</p>
                       </div>
                     )}
                     {viewInvoice.branch && (
                       <div>
                         <Label>Branch</Label>
                         <p>{viewInvoice.branch}</p>
                       </div>
                     )}
                     {viewInvoice.rtgsNeftIfscCode && (
                       <div>
                         <Label>RTGS/NEFT/IFSC Code</Label>
                         <p>{viewInvoice.rtgsNeftIfscCode}</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Terms & Conditions */}
               {viewInvoice.termsAndConditions && (
                 <div className="border rounded-lg p-4 space-y-2">
                   <h3 className="font-semibold">Terms & Conditions</h3>
                   <p className="whitespace-pre-wrap text-sm">{viewInvoice.termsAndConditions}</p>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
       )}
    </div>
  )
}

