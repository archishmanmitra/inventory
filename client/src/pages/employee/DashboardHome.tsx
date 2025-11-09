import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { FileText, ShoppingCart, Package, Zap } from 'lucide-react'
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

  const StatCard = ({ icon: Icon, label, value, subValue, bgColor, iconColor, borderColor }: any) => (
    <Card className={`border-2 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden`}>
      <div className={`h-1 w-full ${bgColor}`}></div>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-6">
        <div className="flex-1">
          <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wide">{label}</CardTitle>
        </div>
        <div className={`p-3.5 rounded-2xl ${bgColor} shadow-md`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-black text-gray-900">{value}</div>
        {subValue && <p className="text-sm text-gray-500 font-medium">{subValue}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black text-gray-900">Welcome back, {user?.name}! 👋</h1>
            <p className="text-gray-500 mt-2 text-base font-medium">Here's your personal activity summary</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700">Active</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          icon={FileText}
          label="My Invoices"
          value={myInvoices.length}
          subValue={`Total: ${formatCurrency(totalInvoiceAmount)}`}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
        />

        <StatCard
          icon={ShoppingCart}
          label="Purchase Orders"
          value={myPurchaseOrders.length}
          subValue={`Total: ${formatCurrency(totalPOAmount)}`}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          borderColor="border-blue-200"
        />

        <StatCard
          icon={Package}
          label="Total Products"
          value={inventory?.summary?.totalProducts || 0}
          subValue="In inventory"
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
          borderColor="border-purple-200"
        />
      </div>

      {/* Activity Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="h-1.5 w-full bg-emerald-500"></div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Invoices Overview</CardTitle>
                <CardDescription className="text-emerald-600 font-semibold mt-1">
                  {myInvoices.length} total invoices
                </CardDescription>
              </div>
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm text-gray-600 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalInvoiceAmount)}</p>
              </div>
              <p className="text-sm text-gray-600">📄 Keep track of all your invoices and transactions</p>
            </div>
          </CardContent>
        </Card>

        {/* PO Overview */}
        <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="h-1.5 w-full bg-blue-500"></div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Purchase Orders</CardTitle>
                <CardDescription className="text-blue-600 font-semibold mt-1">
                  {myPurchaseOrders.length} total orders
                </CardDescription>
              </div>
              <div className="p-3 bg-blue-100 rounded-2xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalPOAmount)}</p>
              </div>
              <p className="text-sm text-gray-600">🛒 Manage your purchase order history</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

