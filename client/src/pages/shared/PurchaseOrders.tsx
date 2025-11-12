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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '../../lib/utils'
import BarcodeScanner from '../../components/BarcodeScanner'
import { useAuthStore } from '../../store/authStore'

interface POItem {
  productId: string
  quantity: number
}

export default function PurchaseOrders() {
  const [isOpen, setIsOpen] = useState(false)
  const [viewPO, setViewPO] = useState<any>(null)
  const [items, setItems] = useState<POItem[]>([])
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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/purchase-orders', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setIsOpen(false)
      setItems([])
      toast.success('Purchase order created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create purchase order')
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

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find((p: any) => p.barcode === barcode)
    if (product) {
      const existingItem = items.find((item) => item.productId === product.id)
      if (existingItem) {
        setItems(
          items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        )
      } else {
        setItems([...items, { productId: product.id, quantity: 1 }])
      }
      toast.success(`Added ${product.name}`)
    } else {
      toast.error('Product not found')
    }
  }

  const handleAddProduct = (productId: string) => {
    const existingItem = items.find((item) => item.productId === productId)
    if (existingItem) {
      setItems(
        items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setItems([...items, { productId, quantity: 1 }])
    }
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId))
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setItems(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('Please add at least one product')
      return
    }
    createMutation.mutate({ items })
  }

  const getProductCost = (productId: string) => {
    return products?.find((p: any) => p.id === productId)?.cost || 0
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + getProductCost(item.productId) * item.quantity,
    0
  )

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
            <Button onClick={() => setItems([])} className="h-10 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Add products to create a new purchase order</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <BarcodeScanner onScan={handleBarcodeScan} />
              <div className="grid gap-2">
                <Label>Add Product Manually</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProduct(e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Select a product...</option>
                  {products?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.cost)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Items</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items added yet
                    </p>
                  ) : (
                    items.map((item) => {
                      const product = products?.find((p: any) => p.id === item.productId)
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(product?.cost || 0)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                            <span className="w-24 text-right font-medium">
                              {formatCurrency((product?.cost || 0) * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </DialogFooter>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
              <DialogDescription>PO #{viewPO.orderNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewPO.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      Total: {formatCurrency(viewPO.totalAmount)}
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
