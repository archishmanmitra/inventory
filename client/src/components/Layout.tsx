import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from './ui/button'
import {
  Package,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Box,
  Warehouse,
  BarChart3,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

interface LayoutProps {
  children: React.ReactNode
  role: 'ADMIN' | 'EMPLOYEE'
}

export default function Layout({ children, role }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = role === 'ADMIN' ? '/admin' : '/employee'

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { path: `${basePath}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    ...(role === 'ADMIN'
      ? [
          { path: `${basePath}/employees`, label: 'Employees', icon: Users },
          { path: `${basePath}/statistics`, label: 'Statistics', icon: BarChart3 },
        ]
      : []),
    { path: `${basePath}/invoices`, label: 'Invoices', icon: FileText },
    { path: `${basePath}/purchase-orders`, label: 'Purchase Orders', icon: ShoppingCart },
    { path: `${basePath}/products`, label: 'Products', icon: Box },
    { path: `${basePath}/inventory`, label: 'Inventory', icon: Warehouse },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

