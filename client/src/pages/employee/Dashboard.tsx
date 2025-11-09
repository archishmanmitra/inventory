import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import DashboardHome from './DashboardHome'
import Invoices from '../shared/Invoices'
import PurchaseOrders from '../shared/PurchaseOrders'
import Products from '../shared/Products'
import Inventory from '../shared/Inventory'

export default function EmployeeDashboard() {
  return (
    <Layout role="EMPLOYEE">
      <Routes>
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="/" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

