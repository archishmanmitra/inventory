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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-600 mt-2">View detailed statistics for invoices and purchase orders</p>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoice Statistics</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Order Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Invoices</CardTitle>
                <CardDescription>Overall invoice statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{invoiceStats?.totalInvoices || 0}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total Revenue: {formatCurrency(invoiceStats?.totalRevenue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Invoices by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoiceStats?.invoicesByStatus?.map((item: any) => (
                    <div key={item.status} className="flex justify-between">
                      <span className="capitalize">{item.status}</span>
                      <span className="font-medium">
                        {item._count.id} ({formatCurrency(item._sum.totalAmount)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoices by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={invoiceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                  <Bar dataKey="amount" fill="#82ca9d" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Invoices</TableHead>
                    <TableHead>Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceStats?.invoicesByUser?.map((item: any) => (
                    <TableRow key={item.userId}>
                      <TableCell>{item.user?.name || 'N/A'}</TableCell>
                      <TableCell>{item.user?.email || 'N/A'}</TableCell>
                      <TableCell>{item._count.id}</TableCell>
                      <TableCell>{formatCurrency(item._sum.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceStats?.recentInvoices?.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.user?.name}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
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

        <TabsContent value="purchase-orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Purchase Orders</CardTitle>
                <CardDescription>Overall purchase order statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{poStats?.totalPurchaseOrders || 0}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total Cost: {formatCurrency(poStats?.totalCost || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Purchase orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poStats?.purchaseOrdersByStatus?.map((item: any) => (
                    <div key={item.status} className="flex justify-between">
                      <span className="capitalize">{item.status}</span>
                      <span className="font-medium">
                        {item._count.id} ({formatCurrency(item._sum.totalAmount)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={poChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                  <Bar dataKey="amount" fill="#82ca9d" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poStats?.purchaseOrdersByUser?.map((item: any) => (
                    <TableRow key={item.userId}>
                      <TableCell>{item.user?.name || 'N/A'}</TableCell>
                      <TableCell>{item.user?.email || 'N/A'}</TableCell>
                      <TableCell>{item._count.id}</TableCell>
                      <TableCell>{formatCurrency(item._sum.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poStats?.recentPurchaseOrders?.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.orderNumber}</TableCell>
                      <TableCell>{po.user?.name}</TableCell>
                      <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
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

