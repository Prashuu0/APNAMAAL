
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/Toast'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function deliveryApi(endpoint, options = {}) {
  const token = localStorage.getItem('apnamaal_token')

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong')
  }

  return data
}

const formatPrice = amount =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`

const buttonPrimary =
  'rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'

function StatusBadge({ status }) {
  const styles = {
    PLACED: 'bg-amber-50 text-amber-700',
    CONFIRMED: 'bg-blue-50 text-blue-700',
    PREPARING: 'bg-purple-50 text-purple-700',
    OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700'
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {(status || 'UNKNOWN').replaceAll('_', ' ')}
    </span>
  )
}

function StatCard({ icon, title, value, description }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-900">{value}</h3>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ icon = '📭', title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{message}</p>
    </div>
  )
}

function OrderCard({
  order,
  active,
  loading,
  onAccept,
  onReject,
  onStart,
  onComplete
}) {
  const restaurant = order.restaurantId
  const customer = order.userId
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY'
  const canStart = ['CONFIRMED', 'PREPARING'].includes(order.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Order ID
          </p>
          <h3 className="mt-1 font-extrabold text-gray-900">
            #{order.orderId || String(order._id || '').slice(-6)}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {restaurant?.name || 'Restaurant'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#fff8f6] p-3">
            <p className="text-xs text-gray-500">Customer</p>
            <p className="mt-1 font-semibold text-gray-900">
              {customer?.name || 'Customer'}
            </p>
            {customer?.phone && (
              <p className="mt-1 text-xs text-gray-500">{customer.phone}</p>
            )}
          </div>

          <div className="rounded-xl bg-[#fff8f6] p-3">
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="mt-1 font-semibold text-gray-900">
              {order.paymentMethod || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Delivery Address
          </p>
          <p className="mt-1 text-sm text-gray-700">
            📍 {order.address || 'Address not available'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Order Items
          </p>
          <div className="mt-2 space-y-2">
            {order.items?.map((item, index) => (
              <div key={item._id || index} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatPrice((item.price || 0) * (item.quantity || 0))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
          <span className="font-semibold text-gray-700">Order Total</span>
          <span className="text-xl font-extrabold text-red-600">
            {formatPrice(order.pricing?.total)}
          </span>
        </div>

        <div className="mt-5">
          {active ? (
            isOutForDelivery ? (
              <button
                onClick={() => onComplete(order._id)}
                disabled={loading}
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : '✓ Mark as Delivered'}
              </button>
            ) : canStart ? (
              <div className="space-y-2">
                <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
                  This order has been assigned to you. Start the delivery when you have collected the order.
                </p>
                <button
                  onClick={() => onStart(order._id)}
                  disabled={loading}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : '🚴 Start Delivery'}
                </button>
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                Waiting for the order to be ready.
              </p>
            )
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onReject(order._id)}
                disabled={loading}
                className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept(order._id)}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Accept Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const { state: { user }, logout } = useApp()
  const { push } = useToast()

  const [profile, setProfile] = useState(null)
  const [availableOrders, setAvailableOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [locationTrackingStatus, setLocationTrackingStatus] = useState('idle')

  const kycStatus = String(profile?.kycStatus || 'PENDING').toUpperCase()
  const isKycApproved = kycStatus === 'APPROVED'
  const isKycRejected = kycStatus === 'REJECTED'

  const loadDashboard = useCallback(async () => {
    try {
      const [profileData, availableData, ordersData] = await Promise.all([
        deliveryApi('/delivery/me'),
        deliveryApi('/delivery/available-orders'),
        deliveryApi('/delivery/my-orders')
      ])

      setProfile(profileData.deliveryBoy)
      setAvailableOrders(availableData.orders || [])
      setMyOrders(ordersData.orders || [])
    } catch (error) {
      push(error.message || 'Unable to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    // Share GPS location only while the delivery partner has an active order.
    if (!profile?._id || profile.status !== 'BUSY') {
      setLocationTrackingStatus('idle')
      return
    }

    if (!navigator.geolocation) {
      setLocationTrackingStatus('unsupported')
      return
    }

    let lastSentAt = 0
    let isMounted = true

    setLocationTrackingStatus('starting')

    const watchId = navigator.geolocation.watchPosition(
      async position => {
        if (!isMounted) return

        const now = Date.now()
        if (now - lastSentAt < 5000) return
        lastSentAt = now

        try {
          await deliveryApi(`/delivery/${profile._id}/location`, {
            method: 'PATCH',
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          })

          if (isMounted) setLocationTrackingStatus('active')
        } catch (error) {
          console.error('GPS location update failed:', error)
          if (isMounted) setLocationTrackingStatus('error')
        }
      },
      error => {
        console.error('GPS permission/location error:', error)
        if (isMounted) {
          setLocationTrackingStatus(
            error.code === 1 ? 'permission-denied' : 'error'
          )
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    )

    return () => {
      isMounted = false
      navigator.geolocation.clearWatch(watchId)
    }
  }, [profile?._id, profile?.status])

  const handleStatusChange = async () => {
    if (!profile || actionLoading) return

    const newStatus =
      profile.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE'

    if (newStatus === 'AVAILABLE' && !isKycApproved) {
      push('Your KYC must be approved before you can go online.', 'error')
      return
    }

    setActionLoading(true)

    try {
      await deliveryApi('/delivery/me/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })

      push(
        newStatus === 'AVAILABLE'
          ? 'You are now online!'
          : 'You are now offline',
        'success'
      )

      await loadDashboard()
    } catch (error) {
      push(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptOrder = async orderId => {
    if (actionLoading) return

    setActionLoading(true)

    try {
      await deliveryApi(`/delivery/orders/${orderId}/accept`, {
        method: 'POST'
      })

      push('Order accepted successfully!', 'success')
      await loadDashboard()
    } catch (error) {
      push(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectOrder = async orderId => {
    if (actionLoading) return

    const reason = window.prompt(
      'Please enter a reason for rejecting this delivery:'
    )

    if (reason === null) return

    setActionLoading(true)

    try {
      await deliveryApi(`/delivery/orders/${orderId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim() || 'Not available'
        })
      })

      push('Delivery assignment rejected.', 'success')
      await loadDashboard()
    } catch (error) {
      push(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartDelivery = async orderId => {
    if (actionLoading) return

    setActionLoading(true)

    try {
      await deliveryApi(`/delivery/orders/${orderId}/start`, {
        method: 'PATCH'
      })

      push('Delivery started! Live location sharing will begin.', 'success')
      await loadDashboard()
    } catch (error) {
      push(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteOrder = async orderId => {
    if (actionLoading) return

    const confirmed = window.confirm(
      'Are you sure this order has been delivered?'
    )

    if (!confirmed) return

    setActionLoading(true)

    try {
      await deliveryApi(`/delivery/orders/${orderId}/complete`, {
        method: 'PATCH'
      })

      push('Delivery completed successfully!', 'success')
      await loadDashboard()
    } catch (error) {
      push(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const activeOrders = myOrders.filter(
    order => !['DELIVERED', 'CANCELLED'].includes(order.status)
  )

  const completedOrders = myOrders.filter(
    order => order.status === 'DELIVERED'
  )

  const isOnline = profile?.status === 'AVAILABLE'
  const isBusy = profile?.status === 'BUSY'

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fffdfb]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
          <p className="text-sm font-medium text-gray-500">
            Loading your delivery dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fffdfb] px-4">
        <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🚴</div>
          <h2 className="mt-4 text-xl font-extrabold text-gray-900">
            Delivery profile not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Please contact support to check your delivery account.
          </p>
          <button onClick={handleLogout} className={`${buttonPrimary} mt-6`}>
            Logout
          </button>
        </div>
      </div>
    )
  }

  const gpsMessage = {
    active: 'Live location sharing is active.',
    starting: 'Connecting to GPS...',
    'permission-denied': 'Allow location permission in your browser to share GPS.',
    unsupported: 'This browser does not support GPS location.',
    error: 'Unable to update GPS location. Check your connection and location settings.',
    idle: 'GPS tracking will start when you begin an active delivery.'
  }[locationTrackingStatus]

  return (
    <div className="min-h-screen bg-[#fffdfb] pb-14">
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-500 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold tracking-wider text-red-100">
              APNAMAAL DELIVERY PARTNER
            </p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Delivery Dashboard
            </h1>
            <p className="mt-2 text-sm text-red-100">
              Welcome back, {profile.name || user?.name || 'Delivery Partner'} 👋
            </p>
            <p className="mt-1 text-sm text-red-100">
              Manage your orders and deliveries from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadDashboard}
              disabled={actionLoading}
              className="rounded-xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon="📦"
            title="Total Deliveries"
            value={profile.totalDeliveries || 0}
            description="Successfully completed deliveries"
          />
          <StatCard
            icon="⭐"
            title="Your Rating"
            value={`${Number(profile.rating || 0).toFixed(1)} / 5`}
            description="Your delivery partner rating"
          />
          <StatCard
            icon="🚴"
            title="Completed Orders"
            value={completedOrders.length}
            description="Orders in your delivery history"
          />
        </div>

        <section className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                KYC Verification
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-extrabold text-gray-900">
                  Your Verification Status
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isKycApproved
                    ? 'bg-green-50 text-green-700'
                    : isKycRejected
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {kycStatus}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                {isKycApproved
                  ? 'Your documents have been verified. You can go online and accept deliveries.'
                  : isKycRejected
                    ? 'Your KYC was rejected. Please review the reason below and contact support to resubmit your documents.'
                    : 'Your KYC is awaiting admin verification. You can go online after it is approved.'}
              </p>

              {isKycRejected && profile.rejectionReason && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-700">
                    REJECTION REASON
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {profile.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="text-4xl">🪪</div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Availability
              </p>

              <div className="mt-2 flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${
                  isOnline ? 'bg-green-500' : isBusy ? 'bg-orange-500' : 'bg-gray-400'
                }`} />
                <h2 className="text-xl font-extrabold text-gray-900">
                  {isBusy
                    ? 'Busy with an order'
                    : isOnline
                      ? 'You are Online'
                      : 'You are Offline'}
                </h2>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {isBusy
                  ? 'Complete your current delivery before changing availability.'
                  : isOnline
                    ? 'You can receive available delivery orders.'
                    : !isKycApproved
                      ? 'KYC approval is required before you can go online.'
                      : 'Go online when you are ready to accept deliveries.'}
              </p>

              {isBusy && (
                <p className={`mt-3 text-sm font-medium ${
                  locationTrackingStatus === 'active' ? 'text-green-700' : 'text-gray-500'
                }`}>
                  📍 {gpsMessage}
                </p>
              )}
            </div>

            <button
              onClick={handleStatusChange}
              disabled={actionLoading || isBusy || (!isKycApproved && !isOnline)}
              className={`rounded-xl px-7 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isOnline
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionLoading
                ? 'Please wait...'
                : isOnline
                  ? 'Go Offline'
                  : isBusy
                    ? 'Currently Busy'
                    : !isKycApproved
                      ? isKycRejected
                        ? 'KYC Rejected'
                        : 'KYC Pending'
                      : 'Go Online'}
            </button>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                My Active Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Orders currently assigned to you.
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600">
              {activeOrders.length} Active
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No active deliveries"
              message="When a delivery partner assignment is accepted, your active orders will appear here."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {activeOrders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  active
                  loading={actionLoading}
                  onStart={handleStartDelivery}
                  onComplete={handleCompleteOrder}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Available Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Accept a delivery assignment when you are ready.
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700">
              {availableOrders.length} Available
            </span>
          </div>

          {!isKycApproved ? (
            <EmptyState
              icon="🪪"
              title="KYC approval required"
              message="Your KYC must be approved before you can receive delivery orders."
            />
          ) : !isOnline ? (
            <EmptyState
              icon="🔴"
              title="You are offline"
              message="Go online to see and accept available delivery orders."
            />
          ) : availableOrders.length === 0 ? (
            <EmptyState
              icon="🛵"
              title="No orders available"
              message="There are no delivery assignments available at the moment. Check again shortly."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {availableOrders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  loading={actionLoading}
                  onAccept={handleAcceptOrder}
                  onReject={handleRejectOrder}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Delivery History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your successfully completed deliveries.
            </p>
          </div>

          {completedOrders.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No completed deliveries yet"
              message="Your completed delivery history will appear here."
            />
          ) : (
            <div className="space-y-3">
              {completedOrders.map(order => (
                <div
                  key={order._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Order #{order.orderId || String(order._id).slice(-6)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {order.restaurantId?.name || 'Restaurant'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <StatusBadge status="DELIVERED" />
                    <p className="mt-2 font-extrabold text-gray-900">
                      {formatPrice(order.pricing?.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
