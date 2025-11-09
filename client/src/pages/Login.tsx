import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { toast } from 'sonner'
import { Package, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated() && user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/employee', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data

      setAuth(user, token)
      toast.success('Login successful')

      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/employee')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Side accent bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-32 w-1 bg-blue-500 rounded-full blur-sm"></div>
        
        <Card className="border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          {/* Header with accent */}
          <div className="bg-white border-b border-gray-100 px-8 py-10">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full scale-110 opacity-50"></div>
                <div className="rounded-full bg-blue-600 p-4 relative">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-center text-4xl font-black text-gray-900 tracking-tight">
              Inventory
            </h1>
            <p className="text-center text-sm text-gray-500 mt-3 font-medium">
              Streamline your warehouse operations
            </p>
          </div>

          {/* Content */}
          <CardContent className="px-8 py-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Email Address</span>
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Password</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-gray-600 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-8"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Divider */}
              {/* <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 font-medium">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                  Create one
                </a>
              </p> */}
            </form>
          </CardContent>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 font-medium">
              🔒 Secure login • Encrypted connection
            </p>
          </div>
        </Card>

        {/* Bottom accent */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">Contact support</a></p>
        </div>
      </div>
    </div>
  )
}

