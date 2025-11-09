import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Package, Users, FileText, ShoppingCart, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

export default function DashboardHome() {
  const { data: invoiceStats } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const res = await api.get('/statistics/invoices')
      return res.data
    },
  })

  const { data: poStats } = useQuery({
    queryKey: ['po-stats'],
    queryFn: async () => {
      const res = await api.get('/statistics/purchase-orders')
      return res.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your inventory management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoiceStats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoiceStats?.totalInvoices || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(poStats?.totalCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {poStats?.totalPurchaseOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((invoiceStats?.totalRevenue || 0) - (poStats?.totalCost || 0))}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Costs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

