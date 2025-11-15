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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>Invoice #{viewInvoice.invoiceNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewInvoice.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      Total: {formatCurrency(viewInvoice.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

