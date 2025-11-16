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
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Plus, Eye, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import PurchaseOrderFormNew from '../admin/PurchaseOrderFormNew'

export default function PurchaseOrders() {
  const [isOpen, setIsOpen] = useState(false)
  const [viewPO, setViewPO] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchase-orders')
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/purchase-orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete purchase order')
    },
  })

  const handleDownloadPDF = async (id: string, orderNumber: string) => {
    try {
      const response = await api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `po-${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Purchase order downloaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to download purchase order')
    }
  }

  // Filter purchase orders based on active tab
  const displayedPOs = useMemo(() => {
    if (!purchaseOrders) return []
    if (user?.role === 'EMPLOYEE') {
      return purchaseOrders.filter((po: any) => po.userId === user.id)
    }
    // Admin: filter based on active tab
    if (activeTab === 'my') {
      return purchaseOrders.filter((po: any) => po.userId === user?.id)
    }
    return purchaseOrders
  }, [purchaseOrders, activeTab, user])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
         <div>
           <h1 className="text-5xl font-black text-gray-900">Purchase Orders</h1>
           <p className="text-gray-500 mt-2 text-base font-medium">
             {user?.role === 'ADMIN' ? 'Manage all purchase orders' : 'Your purchase orders'}
           </p>
         </div>
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
           <DialogTrigger asChild>
             <Button className="h-10 bg-blue-600 hover:bg-blue-700">
               <Plus className="h-4 w-4 mr-2" />
               Create Purchase Order
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Create Purchase Order</DialogTitle>
               <DialogDescription>Fill in the details and add products to create a new purchase order</DialogDescription>
             </DialogHeader>
             <PurchaseOrderFormNew onSuccess={() => {
               setIsOpen(false)
               queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
             }} />
           </DialogContent>
         </Dialog>
       </div>

      {user?.role === 'ADMIN' ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')} className="space-y-6">
          <TabsList className="bg-gray-100 border-2 border-gray-200 rounded-xl p-1 h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">All Purchase Orders</TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">My Purchase Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-blue-500"></div>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No purchase orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders?.map((po: any) => (
                        <TableRow key={po.id}>
                           <TableCell className="font-medium">{po.orderNumber}</TableCell>
                           <TableCell>{po.user?.name}</TableCell>
                           <TableCell className="text-right">{formatCurrency(po.totalAmount)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(po.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewPO(po)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(po.id, po.orderNumber)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this purchase order?')) {
                                    deleteMutation.mutate(po.id)
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
            <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-blue-500"></div>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                       <TableHead className="text-right">Amount</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {displayedPOs.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                           No purchase orders found
                         </TableCell>
                       </TableRow>
                      ) : (
                       displayedPOs.map((po: any) => (
                         <TableRow key={po.id}>
                           <TableCell className="font-medium">{po.orderNumber}</TableCell>
                           <TableCell className="text-right">{formatCurrency(po.totalAmount)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(po.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewPO(po)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(po.id, po.orderNumber)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this purchase order?')) {
                                    deleteMutation.mutate(po.id)
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
        <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="h-1.5 w-full bg-blue-500"></div>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Order Number</TableHead>
                   <TableHead className="text-right">Amount</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
                </TableHeader>
                <TableBody>
                 {displayedPOs.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                       No purchase orders found
                     </TableCell>
                   </TableRow>
                 ) : (
                   displayedPOs.map((po: any) => (
                     <TableRow key={po.id}>
                       <TableCell className="font-medium">{po.orderNumber}</TableCell>
                       <TableCell className="text-right">{formatCurrency(po.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                          {po.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(po.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewPO(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(po.id, po.orderNumber)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this purchase order?')) {
                                deleteMutation.mutate(po.id)
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

                      {viewPO && (
                      <Dialog open={!!viewPO} onOpenChange={() => setViewPO(null)}>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                      <DialogTitle>Purchase Order Details</DialogTitle>
                      <DialogDescription>PO #{viewPO.orderNumber}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                      <Label>Order Number</Label>
                      <p className="font-medium">{viewPO.orderNumber}</p>
                      </div>
                      <div>
                      <Label>Status</Label>
                      <p className="capitalize">{viewPO.status}</p>
                      </div>
                      <div>
                      <Label>Created By</Label>
                      <p>{viewPO.user?.name}</p>
                      </div>
                      <div>
                      <Label>Date</Label>
                      <p>{formatDate(viewPO.createdAt)}</p>
                      </div>
                      </div>

                      {/* PO Details */}
                      <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">Purchase Order Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                      <Label>PO Date</Label>
                      <p>{viewPO.poDate ? formatDate(viewPO.poDate) : '-'}</p>
                      </div>
                      <div>
                      <Label>GST No.</Label>
                      <p>{viewPO.gstNo || '-'}</p>
                      </div>
                      </div>
                      </div>

                      {/* Shipment and Supplier Details */}
                      <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <h3 className="font-semibold">Shipment Address</h3>
                      <div>
                      <Label>Company Name</Label>
                      <p>{viewPO.shipmentName || '-'}</p>
                      </div>
                      <div>
                      <Label>Address</Label>
                      <p className="whitespace-pre-wrap">{viewPO.shipmentAddress || '-'}</p>
                      </div>
                      <div>
                      <Label>State</Label>
                      <p>{viewPO.shipmentState || '-'}</p>
                      </div>
                      <div>
                      <Label>Phone</Label>
                      <p>{viewPO.shipmentPhone || '-'}</p>
                      </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <h3 className="font-semibold">Vendor Address</h3>
                      <div>
                      <Label>Supplier Name</Label>
                      <p>{viewPO.supplierName || '-'}</p>
                      </div>
                      <div>
                      <Label>Address</Label>
                      <p className="whitespace-pre-wrap">{viewPO.supplierAddress || '-'}</p>
                      </div>
                      <div>
                      <Label>State</Label>
                      <p>{viewPO.supplierState || '-'}</p>
                      </div>
                      <div>
                      <Label>GST No.</Label>
                      <p>{viewPO.supplierGSTNo || '-'}</p>
                      </div>
                      <div>
                      <Label>Phone</Label>
                      <p>{viewPO.supplierPhone || '-'}</p>
                      </div>
                      <div>
                      <Label>Email</Label>
                      <p>{viewPO.supplierEmail || '-'}</p>
                      </div>
                      <div>
                      <Label>Contact Person</Label>
                      <p>{viewPO.supplierContactPerson || '-'}</p>
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
                      <TableHead>Item Description</TableHead>
                      <TableHead>HSN Code</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Discount %</TableHead>
                      <TableHead className="text-right">Rate/Unit</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {viewPO.items?.map((item: any, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.itemDescription || item.product?.name}</TableCell>
                        <TableCell>{item.hsnCode || '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.discount || 0}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value || 0)}</TableCell>
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
                      <span>Total:</span>
                      <span className="font-medium">{formatCurrency(viewPO.totalAmount || 0)}</span>
                      </div>
                      {viewPO.discountAmount > 0 && (
                      <div className="flex justify-between text-orange-600">
                      <span>Discount ({viewPO.discountRate}%):</span>
                      <span>-{formatCurrency(viewPO.discountAmount)}</span>
                      </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                      <span>After Discount:</span>
                      <span className="font-medium">{formatCurrency((viewPO.totalAmount || 0) - (viewPO.discountAmount || 0))}</span>
                      </div>
                      {viewPO.cgstAmount > 0 && (
                      <div className="flex justify-between">
                      <span>CGST ({viewPO.cgstRate}%):</span>
                      <span>{formatCurrency(viewPO.cgstAmount)}</span>
                      </div>
                      )}
                      {viewPO.sgstAmount > 0 && (
                      <div className="flex justify-between">
                      <span>SGST ({viewPO.sgstRate}%):</span>
                      <span>{formatCurrency(viewPO.sgstAmount)}</span>
                      </div>
                      )}
                      {viewPO.igstAmount > 0 && (
                      <div className="flex justify-between">
                      <span>IGST ({viewPO.igstRate}%):</span>
                      <span>{formatCurrency(viewPO.igstAmount)}</span>
                      </div>
                      )}
                      {(viewPO.sgstAmount > 0 || viewPO.cgstAmount > 0 || viewPO.igstAmount > 0) && (
                      <div className="flex justify-between border-t pt-2">
                      <span>Subtotal After Taxes:</span>
                      <span className="font-medium">{formatCurrency(Math.floor(((viewPO.totalAmount || 0) - (viewPO.discountAmount || 0) + (viewPO.sgstAmount || 0) + (viewPO.cgstAmount || 0) + (viewPO.igstAmount || 0)) * 100) / 100)}</span>
                      </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2 text-base">
                      <span>Net PO Amount:</span>
                      <span>{formatCurrency(viewPO.netAmount || viewPO.totalAmount || 0)}</span>
                      </div>
                      </div>
                      </div>

                      {/* Payment & Delivery Terms */}
                      <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-sm">Payment Terms</h3>
                      <p className="whitespace-pre-wrap text-sm">{viewPO.paymentTerms || '-'}</p>
                      </div>
                      <div className="border rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-sm">Delivery</h3>
                      <p className="whitespace-pre-wrap text-sm">{viewPO.delivery || '-'}</p>
                      </div>
                      </div>

                      {/* Terms & Conditions */}
                      {viewPO.termsAndConditions && (
                      <div className="border rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold">Special Terms and Conditions</h3>
                      <p className="whitespace-pre-wrap text-sm">{viewPO.termsAndConditions}</p>
                      </div>
                      )}
                      </div>
                      </DialogContent>
                      </Dialog>
                      )}
    </div>
  )
}
