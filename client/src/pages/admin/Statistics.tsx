import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { formatCurrency, formatDate } from '../../lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Statistics() {
  const { data: invoiceStats, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const res = await api.get('/statistics/invoices')
      return res.data
    },
  })

  const { data: poStats, isLoading: poLoading } = useQuery({
    queryKey: ['po-stats'],
    queryFn: async () => {
      const res = await api.get('/statistics/purchase-orders')
      return res.data
    },
  })

  if (invoiceLoading || poLoading) {
    return <div>Loading...</div>
  }

  const invoiceChartData = invoiceStats?.invoicesByStatus?.map((item: any) => ({
    status: item.status,
    count: item._count.id,
    amount: item._sum.totalAmount,
  })) || []

  const poChartData = poStats?.purchaseOrdersByStatus?.map((item: any) => ({
    status: item.status,
    count: item._count.id,
    amount: item._sum.totalAmount,
  })) || []

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900">Business Statistics</h1>
        <p className="text-gray-500 mt-2 text-base font-medium">Comprehensive analytics for invoices and purchase orders</p>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="bg-gray-100 border-2 border-gray-200 rounded-xl p-1 h-auto">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">Invoice Statistics</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:rounded-lg px-4 py-2 font-semibold transition-all">Purchase Order Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-emerald-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-emerald-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Total Invoices</CardTitle>
                <CardDescription className="font-medium text-emerald-600">Overall invoice statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-emerald-600">{invoiceStats?.totalInvoices || 0}</div>
                <p className="text-sm font-semibold text-gray-600 mt-3">
                  Total Revenue: <span className="text-emerald-600 font-bold">{formatCurrency(invoiceStats?.totalRevenue || 0)}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-orange-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status Breakdown</CardTitle>
                <CardDescription className="font-medium text-orange-600">Invoices by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoiceStats?.invoicesByStatus?.map((item: any) => (
                    <div key={item.status} className="flex justify-between items-center p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="capitalize font-semibold text-gray-800">{item.status}</span>
                      <span className="font-bold text-orange-600">
                        {item._count.id} • {formatCurrency(item._sum.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-blue-500"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Invoices by Status</CardTitle>
              <CardDescription className="font-medium text-blue-600">Visual breakdown of invoice distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={invoiceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="status" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Count" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="amount" fill="#3b82f6" name="Amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-purple-500"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Invoices by Employee</CardTitle>
              <CardDescription className="font-medium text-purple-600">Employee invoice performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Total Invoices</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceStats?.invoicesByUser?.map((item: any) => (
                    <TableRow key={item.userId}>
                      <TableCell>{item.user?.name || 'N/A'}</TableCell>
                      <TableCell>{item.user?.email || 'N/A'}</TableCell>
                      <TableCell className="text-center">{item._count.id}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item._sum.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent Invoices</CardTitle>
              <CardDescription className="font-medium text-teal-600">Latest invoice activity</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceStats?.recentInvoices?.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.user?.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 capitalize font-semibold">
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-blue-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Total Purchase Orders</CardTitle>
                <CardDescription className="font-medium text-blue-600">Overall purchase order statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-blue-600">{poStats?.totalPurchaseOrders || 0}</div>
                <p className="text-sm font-semibold text-gray-600 mt-3">
                  Total Cost: <span className="text-blue-600 font-bold">{formatCurrency(poStats?.totalCost || 0)}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="h-1.5 w-full bg-cyan-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status Breakdown</CardTitle>
                <CardDescription className="font-medium text-cyan-600">Purchase orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {poStats?.purchaseOrdersByStatus?.map((item: any) => (
                    <div key={item.status} className="flex justify-between items-center p-2.5 bg-cyan-50 rounded-lg border border-cyan-200">
                      <span className="capitalize font-semibold text-gray-800">{item.status}</span>
                      <span className="font-bold text-cyan-600">
                        {item._count.id} • {formatCurrency(item._sum.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-indigo-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-indigo-500"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Purchase Orders by Status</CardTitle>
              <CardDescription className="font-medium text-indigo-600">Visual breakdown of purchase order distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={poChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="status" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9" name="Count" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="amount" fill="#6366f1" name="Amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-violet-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-violet-500"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Purchase Orders by Employee</CardTitle>
              <CardDescription className="font-medium text-violet-600">Employee purchase order performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Total Orders</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poStats?.purchaseOrdersByUser?.map((item: any) => (
                    <TableRow key={item.userId}>
                      <TableCell>{item.user?.name || 'N/A'}</TableCell>
                      <TableCell>{item.user?.email || 'N/A'}</TableCell>
                      <TableCell className="text-center">{item._count.id}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item._sum.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gray-400"></div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent Purchase Orders</CardTitle>
              <CardDescription className="font-medium text-gray-600">Latest purchase order activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poStats?.recentPurchaseOrders?.map((po: any) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

