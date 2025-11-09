import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { FileText, ShoppingCart, Package } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

export default function DashboardHome() {
  const { user } = useAuthStore()

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices')
      return res.data
    },
  })

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchase-orders')
      return res.data
    },
  })

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory')
      return res.data
    },
  })

  const myInvoices = invoices?.filter((inv: any) => inv.userId === user?.id) || []
  const myPurchaseOrders = purchaseOrders?.filter((po: any) => po.userId === user?.id) || []

  const totalInvoiceAmount = myInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0)
  const totalPOAmount = myPurchaseOrders.reduce((sum: number, po: any) => sum + po.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalInvoiceAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPurchaseOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalPOAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory?.summary?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

