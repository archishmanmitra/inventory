import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Package, AlertTriangle, XCircle } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

export default function Inventory() {
  const [search, setSearch] = useState('')

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', search],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { search } })
      return res.data
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Status</h1>
        <p className="text-gray-600 mt-2">View current inventory levels and status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory?.summary?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventory?.summary?.totalInventoryValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Based on cost price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventory?.summary?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Stock &lt; 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {inventory?.summary?.outOfStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">No stock available</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Current inventory levels</CardDescription>
            </div>
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory?.products?.map((product: any) => {
                const isLowStock = product.stock < 10
                const isOutOfStock = product.stock === 0
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{formatCurrency(product.cost)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isOutOfStock
                            ? 'text-destructive font-bold'
                            : isLowStock
                            ? 'text-yellow-600 font-medium'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.cost * product.stock)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {inventory?.summary?.lowStockItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Items
            </CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventory.summary.lowStockItems.map((product: any) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current stock: {product.stock} {product.unit}
                    </p>
                  </div>
                  <span className="text-yellow-600 font-medium">Low Stock</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inventory?.summary?.outOfStockItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Out of Stock Items
            </CardTitle>
            <CardDescription>Items that are completely out of stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventory.summary.outOfStockItems.map((product: any) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current stock: {product.stock} {product.unit}
                    </p>
                  </div>
                  <span className="text-destructive font-medium">Out of Stock</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

