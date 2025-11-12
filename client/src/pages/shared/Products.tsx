import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '../../lib/utils'

export default function Products() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/products', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsOpen(false)
      toast.success('Product created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/products/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsOpen(false)
      setEditingProduct(null)
      toast.success('Product updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update product')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete product')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      barcode: formData.get('barcode') || null,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
      unit: formData.get('unit') || 'pcs',
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
  <div className="space-y-6">
  <div className="flex justify-between items-center mb-8">
  <div>
  <h1 className="text-5xl font-black text-gray-900">Products</h1>
  <p className="text-gray-500 mt-2 text-base font-medium">Manage your product catalog</p>
  </div>
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
  <Button onClick={() => setEditingProduct(null)} className="h-10 bg-purple-600 hover:bg-purple-700">
  <Plus className="h-4 w-4 mr-2" />
  Add Product
  </Button>
  </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit' : 'Add'} Product</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update product information' : 'Add a new product to your catalog'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingProduct?.description || ''}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    defaultValue={editingProduct?.barcode || ''}
                    placeholder="Optional - for barcode scanning"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingProduct?.price}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cost">Cost *</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingProduct?.cost}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      defaultValue={editingProduct?.stock || 0}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      name="unit"
                      defaultValue={editingProduct?.unit || 'pcs'}
                      placeholder="pcs, kg, etc."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    setEditingProduct(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 border-purple-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="h-1.5 w-full bg-purple-500"></div>
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-lg font-bold">Product Catalog</CardTitle>
         </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Name</TableHead>
                <TableHead className="text-gray-700 font-semibold">Barcode</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Price</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Cost</TableHead>
                <TableHead className="text-gray-700 font-semibold text-center">Stock</TableHead>
                <TableHead className="text-gray-700 font-semibold">Unit</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {products?.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                <TableCell className="text-center">
                  <span className={product.stock < 10 ? 'text-destructive font-medium' : ''}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product)
                        setIsOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          deleteMutation.mutate(product.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
           </CardContent>
           </Card>
           </div>
           )
}

