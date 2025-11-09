import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Employees from './Employees'
import Statistics from './Statistics'
import Invoices from '../shared/Invoices'
import PurchaseOrders from '../shared/PurchaseOrders'
import Products from '../shared/Products'
import Inventory from '../shared/Inventory'
import DashboardHome from './DashboardHome'

export default function AdminDashboard() {
  return (
    <Layout role="ADMIN">
      <Routes>
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="employees" element={<Employees />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="/" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

