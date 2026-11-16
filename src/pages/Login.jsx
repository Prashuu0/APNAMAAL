
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { useApp } from '../context/AppContext'
import { loginUser } from '../services/api'

const roles = [
  {
    value: 'user',
    label: 'Customer',
    description: 'Order delicious food',
    icon: '👤',
  },
  {
    value: 'restaurant_owner',
    label: 'Restaurant Owner',
    description: 'Manage your restaurant',
    icon: '🍽️',
  },
  {
    value: 'delivery',
    label: 'Delivery Partner',
    description: 'Deliver and earn',
    icon: '🚚',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage ApnaMaal',
    icon: '⚙️',
  },
]

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'

const labelClass = 'mb-2 block text-sm font-semibold text-gray-700'

export default function Login() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { setUser } = useApp()

  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [method, setMethod] = useState('phone')

  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryPassword, setDeliveryPassword] = useState('')

  const handleUserLogin = async () => {
    if (method === 'phone' && phone.length !== 10) {
      push('Please enter a valid 10-digit phone number', 'error')
      return
    }

    if (method === 'email' && (!email || !email.includes('@'))) {
      push('Please enter a valid email address', 'error')
      return
    }

    if (!userPassword) {
      push('Password is required', 'error')
      return
    }

    setLoading(true)

    try {
      const result = await loginUser(
        method === 'phone'
          ? { phone, password: userPassword }
          : { email, password: userPassword }
      )

      const user = result?.user

      if (user?.role === 'user') {
        setUser(user)
        push('Login successful!', 'success')
        navigate('/home')
      } else {
        push('Invalid customer account', 'error')
      }
    } catch (error) {
      push(error.message || 'Login failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurantOwnerLogin = async () => {
    if (!ownerEmail || !ownerEmail.includes('@')) {
      push('Please enter a valid email address', 'error')
      return
    }

    if (!ownerPassword) {
      push('Password is required for restaurant owners', 'error')
      return
    }

    setLoading(true)

    try {
      const result = await loginUser({
        email: ownerEmail,
        password: ownerPassword,
      })

      const user = result?.user

      if (user?.role === 'restaurant_owner') {
        setUser(user)
        push('Login successful!', 'success')
        navigate('/restaurant/dashboard')
      } else {
        push('Invalid credentials or account type', 'error')
      }
    } catch (error) {
      push(error.message || 'Login failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryLogin = async () => {
    if (!deliveryPhone || deliveryPhone.length !== 10) {
      push('Please enter a valid 10-digit phone number', 'error')
      return
    }

    if (!deliveryPassword) {
      push('Password is required for delivery partners', 'error')
      return
    }

    setLoading(true)

    try {
      const result = await loginUser({
        phone: deliveryPhone,
        password: deliveryPassword,
      })

      const user = result?.user

      if (user?.role === 'delivery') {
        setUser(user)
        push('Login successful!', 'success')
        navigate('/delivery/dashboard')
      } else {
        push('Invalid credentials or account type', 'error')
      }
    } catch (error) {
      push(error.message || 'Login failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!ownerEmail || !ownerEmail.includes('@')) {
      push('Please enter a valid email address', 'error')
      return
    }

    if (!ownerPassword) {
      push('Password is required for admin', 'error')
      return
    }

    setLoading(true)

    try {
      const result = await loginUser({
        email: ownerEmail,
        password: ownerPassword,
      })

      const user = result?.user

      if (user?.role === 'admin') {
        setUser(user)
        push('Login successful!', 'success')
        navigate('/admin/dashboard')
      } else {
        push('Invalid credentials or account type', 'error')
      }
    } catch (error) {
      push(error.message || 'Login failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedRole('')
    setPhone('')
    setEmail('')
    setUserPassword('')
    setMethod('phone')
    setOwnerEmail('')
    setOwnerPassword('')
    setDeliveryPhone('')
    setDeliveryPassword('')
  }

  const selectedRoleData = roles.find(
    (role) => role.value === selectedRole
  )

  const renderPassword = (value, setter, placeholder) => (
    <div>
      <label className={labelClass}>Password *</label>
      <input
        type="password"
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="current-password"
      />
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-100/60 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-2xl shadow-red-100/50 md:grid-cols-2">

        {/* Left Branding Section */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 via-red-600 to-red-800 p-10 text-white md:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[35px] border-white/10" />

          <div className="relative z-10">
            <Link to="/home" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg">
                🍔
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Apna<span className="text-orange-200">Maal</span>
              </span>
            </Link>

            <div className="mt-24">
              <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
                Welcome Back
              </span>

              <h1 className="mt-7 text-5xl font-extrabold leading-tight">
                Good food.
                <br />
                Great mood.
                <br />
                <span className="text-orange-200">Every day.</span>
              </h1>

              <p className="mt-6 max-w-sm text-base leading-7 text-red-100">
                Your favourite meals are just a few clicks away.
                Sign in and let ApnaMaal bring happiness to your doorstep.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-red-100">
            <span className="text-xl">❤️</span>
            Made with love for food lovers.
          </div>
        </div>

        {/* Right Login Section */}
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 md:hidden">
              <span className="text-2xl">🍔</span>
              <span className="text-xl font-extrabold text-gray-900">
                Apna<span className="text-red-600">Maal</span>
              </span>
            </Link>

            <Link
              to="/home"
              className="ml-auto rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Go to home"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              ApnaMaal Account
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {selectedRole ? 'Welcome back!' : 'Sign in to continue'}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {selectedRole
                ? `Login as ${selectedRoleData?.label}`
                : 'Choose your account type to get started.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-3"
              >
                <label className={labelClass}>Select your role *</label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {roles.map((role) => (
                    <motion.button
                      key={role.value}
                      type="button"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(role.value)}
                      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50/50 hover:shadow-lg hover:shadow-red-100/50"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl transition group-hover:bg-red-100">
                        {role.icon}
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900">
                          {role.label}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {role.description}
                        </span>
                      </span>

                      <span className="ml-auto text-lg text-gray-300 transition group-hover:translate-x-1 group-hover:text-red-600">
                        →
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-red-600"
                >
                  <span className="text-lg">←</span>
                  Back to role selection
                </button>

                {/* Customer Login */}
                {selectedRole === 'user' && (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <label className={labelClass}>
                          {method === 'phone' ? 'Phone Number' : 'Email Address'} *
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setMethod(method === 'phone' ? 'email' : 'phone')
                            setUserPassword('')
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Use {method === 'phone' ? 'Email' : 'Phone'} instead
                        </button>
                      </div>

                      {method === 'phone' ? (
                        <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100">
                          <span className="mr-3 text-xl">🇮🇳</span>
                          <span className="border-r border-gray-200 pr-3 text-sm font-bold text-gray-700">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                            }
                            placeholder="Enter 10-digit phone number"
                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            maxLength={10}
                            autoComplete="tel-national"
                          />
                        </div>
                      ) : (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className={inputClass}
                          autoComplete="email"
                        />
                      )}
                    </div>

                    {renderPassword(userPassword, setUserPassword, 'Enter your password')}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUserLogin}
                      disabled={loading || !userPassword}
                      className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Login to ApnaMaal →'}
                    </motion.button>
                  </div>
                )}

                {/* Restaurant Owner Login */}
                {selectedRole === 'restaurant_owner' && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Business Email *</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="business@restaurant.com"
                        className={inputClass}
                        autoComplete="email"
                      />
                    </div>

                    {renderPassword(ownerPassword, setOwnerPassword, 'Enter your password')}

                    <button
                      onClick={handleRestaurantOwnerLogin}
                      disabled={loading || !ownerEmail || !ownerPassword}
                      className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Login to Owner Dashboard →'}
                    </button>
                  </div>
                )}

                {/* Delivery Partner Login */}
                {selectedRole === 'delivery' && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Phone Number *</label>

                      <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100">
                        <span className="mr-3 text-xl">🇮🇳</span>
                        <span className="border-r border-gray-200 pr-3 text-sm font-bold text-gray-700">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={deliveryPhone}
                          onChange={(e) =>
                            setDeliveryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          placeholder="Enter 10-digit phone number"
                          className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                          maxLength={10}
                          autoComplete="tel-national"
                        />
                      </div>
                    </div>

                    {renderPassword(deliveryPassword, setDeliveryPassword, 'Enter your password')}

                    <button
                      onClick={handleDeliveryLogin}
                      disabled={loading || deliveryPhone.length !== 10 || !deliveryPassword}
                      className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Login to Delivery Dashboard →'}
                    </button>
                  </div>
                )}

                {/* Admin Login */}
                {selectedRole === 'admin' && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Admin Email *</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="admin@apnamaal.com"
                        className={inputClass}
                        autoComplete="username"
                      />
                    </div>

                    {renderPassword(ownerPassword, setOwnerPassword, 'Enter admin password')}

                    <button
                      onClick={handleAdminLogin}
                      disabled={loading || !ownerEmail || !ownerPassword}
                      className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Login to Admin Panel →'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedRole && (
            <div className="mt-8 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-500">
                New to ApnaMaal?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} ApnaMaal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
