import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Package, Users, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
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

  const netProfit = (invoiceStats?.totalRevenue || 0) - (poStats?.totalCost || 0)
  const profitMargin = invoiceStats?.totalRevenue ? ((netProfit / invoiceStats.totalRevenue) * 100).toFixed(1) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-2 text-base font-medium">Welcome back! Here's your business overview</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700">Live</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={formatCurrency(invoiceStats?.totalRevenue || 0)}
          subValue={`${invoiceStats?.totalInvoices || 0} invoices processed`}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
        />

        <StatCard
          icon={ShoppingCart}
          label="Purchase Cost"
          value={formatCurrency(poStats?.totalCost || 0)}
          subValue={`${poStats?.totalPurchaseOrders || 0} purchase orders`}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          borderColor="border-blue-200"
        />

        <StatCard
          icon={Users}
          label="Team Members"
          value={users?.length || 0}
          subValue="Active employees"
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
          borderColor="border-purple-200"
        />

        <StatCard
          icon={Package}
          label="Net Profit"
          value={formatCurrency(netProfit)}
          subValue={`${profitMargin}% profit margin`}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
          borderColor="border-orange-200"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Insight */}
        <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="h-1.5 w-full bg-emerald-500"></div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Revenue Insight</CardTitle>
                <CardDescription className="text-emerald-600 font-semibold mt-1">
                  {invoiceStats?.totalInvoices || 0} invoices
                </CardDescription>
              </div>
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <ArrowUpRight className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(invoiceStats?.totalRevenue || 0)}</span>
              </div>
              <p className="text-sm text-gray-600">📈 Your revenue is growing strong this period</p>
            </div>
          </CardContent>
        </Card>

        {/* Cost Overview */}
        <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="h-1.5 w-full bg-blue-500"></div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Cost Overview</CardTitle>
                <CardDescription className="text-blue-600 font-semibold mt-1">
                  {poStats?.totalPurchaseOrders || 0} orders
                </CardDescription>
              </div>
              <div className="p-3 bg-blue-100 rounded-2xl">
                <ArrowDownRight className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Total Spend</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(poStats?.totalCost || 0)}</span>
              </div>
              <p className="text-sm text-gray-600">📦 Maintaining optimal inventory levels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Summary */}
      <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="h-2 w-full bg-orange-500"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Financial Summary</CardTitle>
              <CardDescription className="mt-1">Period performance metrics</CardDescription>
            </div>
            <div className="p-4 bg-orange-100 rounded-2xl">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Gross Revenue</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(invoiceStats?.totalRevenue || 0)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Total Costs</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(poStats?.totalCost || 0)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Net Profit</p>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(netProfit)}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-2">{profitMargin}% margin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

