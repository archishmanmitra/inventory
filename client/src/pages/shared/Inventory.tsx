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
import { Package, AlertTriangle, XCircle, TrendingUp, Search } from 'lucide-react'
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

  const StatCard = ({ icon: Icon, label, value, subValue, bgColor, iconColor, borderColor }: any) => (
  <Card className={`border-2 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden`}>
  <div className={`h-1.5 w-full ${bgColor}`}></div>
  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-6">
  <div className="flex-1">
  <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-widest">{label}</CardTitle>
  </div>
  <div className={`p-3 rounded-xl ${bgColor} shadow-md`}>
  <Icon className={`h-5 w-5 ${iconColor}`} />
  </div>
  </CardHeader>
  <CardContent className="space-y-2">
  <div className="text-4xl font-black text-gray-900">{value}</div>
  {subValue && <p className="text-xs text-gray-500 font-semibold">{subValue}</p>}
  </CardContent>
  </Card>
  )

  return (
    <div className="space-y-8">
      <div className="mb-10">
      <h1 className="text-5xl font-black text-gray-900">Inventory Management</h1>
      <p className="text-gray-500 mt-2 text-base font-medium">Monitor stock levels, values, and alerts in real-time</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={inventory?.summary?.totalProducts || 0}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
        />

        <StatCard
          icon={TrendingUp}
          label="Inventory Value"
          value={formatCurrency(inventory?.summary?.totalInventoryValue || 0)}
          subValue="At cost price"
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
        />

        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={inventory?.summary?.lowStockCount || 0}
          subValue="Stock < 10 units"
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
          borderColor="border-amber-200"
        />

        <StatCard
          icon={XCircle}
          label="Out of Stock"
          value={inventory?.summary?.outOfStockCount || 0}
          subValue="Need immediate action"
          bgColor="bg-red-100"
          iconColor="text-red-600"
          borderColor="border-red-200"
        />
      </div>

      <Card className="border-2 border-cyan-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="h-1.5 w-full bg-cyan-500"></div>
      <CardHeader className="border-b bg-gray-50">
      <div className="flex justify-between items-center">
      <div>
      <CardTitle className="text-lg font-bold">All Products</CardTitle>
        <CardDescription className="font-medium text-cyan-600">Complete inventory overview</CardDescription>
      </div>
      <div className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
      placeholder="Search products..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
        className="pl-10 bg-white border-cyan-200 focus:border-cyan-500"
        />
        </div>
        </div>
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
                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory?.products?.map((product: any) => {
                const isLowStock = product.stock < 10
                const isOutOfStock = product.stock === 0
                return (
                  <TableRow key={product.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">{product.barcode || '-'}</TableCell>
                    <TableCell className="text-right text-gray-900">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right text-gray-600">{formatCurrency(product.cost)}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          isOutOfStock
                            ? 'font-bold text-red-600'
                            : isLowStock
                            ? 'font-semibold text-amber-600'
                            : 'text-emerald-600 font-medium'
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{product.unit}</TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
                          <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
                          <div className="h-1.5 w-1.5 bg-amber-600 rounded-full" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                          <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
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
      <Card className="border-2 border-amber-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-50">
      <CardTitle className="flex items-center gap-2 text-amber-900 text-lg font-bold">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      Low Stock Alerts
      </CardTitle>
      <CardDescription className="text-amber-700 font-semibold mt-2">
      {inventory.summary.lowStockItems.length} item{inventory.summary.lowStockItems.length !== 1 ? 's' : ''} need restocking soon
      </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
      <div className="space-y-3">
      {inventory.summary.lowStockItems.map((product: any) => (
      <div
      key={product.id}
      className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50 border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-100 hover:shadow-md transition-all group"
      >
      <div className="flex-1">
      <p className="font-bold text-gray-900 group-hover:text-amber-900 transition-colors">{product.name}</p>
      <p className="text-sm text-amber-700 font-semibold mt-1">
      Only <span className="font-bold text-amber-900">{product.stock}</span> {product.unit} left in stock
      </p>
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs whitespace-nowrap hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg">
      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
      Reorder
      </span>
      </div>
      ))}
      </div>
      </CardContent>
      </Card>
      )}

      {inventory?.summary?.outOfStockItems?.length > 0 && (
      <Card className="border-2 border-red-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-500"></div>
      <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-50">
      <CardTitle className="flex items-center gap-2 text-red-900 text-lg font-bold">
      <XCircle className="h-5 w-5 text-red-600" />
      Out of Stock
      </CardTitle>
      <CardDescription className="text-red-700 font-semibold mt-2">
      {inventory.summary.outOfStockItems.length} item{inventory.summary.outOfStockItems.length !== 1 ? 's' : ''} critically unavailable
      </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
      <div className="space-y-3">
      {inventory.summary.outOfStockItems.map((product: any) => (
      <div
      key={product.id}
      className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-50 border-2 border-red-200 hover:border-red-300 hover:bg-red-100 hover:shadow-md transition-all group"
      >
      <div className="flex-1">
      <p className="font-bold text-gray-900 group-hover:text-red-900 transition-colors">{product.name}</p>
      <p className="text-sm text-red-700 font-semibold mt-1">
      {product.stock} {product.unit} available - Immediate action needed
      </p>
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs whitespace-nowrap hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg">
      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
      Critical
      </span>
      </div>
      ))}
      </div>
      </CardContent>
      </Card>
      )}
    </div>
  )
}
