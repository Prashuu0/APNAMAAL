
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { pollOrderStatus, cancelOrder } from '../services/api'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const steps = [
  { key: 'PLACED', label: 'Order Placed', icon: '📦', description: 'We have received your order.' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✓', description: 'Restaurant has accepted your order.' },
  { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳', description: 'Your food is being prepared fresh.' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: '🚚', description: 'Your delivery partner is on the way.' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉', description: 'Enjoy your delicious meal!' },
]

async function fetchTrackingLocation(orderId) {
  const token = localStorage.getItem('apnamaal_token')

  const response = await fetch(
    `${API_BASE_URL}/delivery/track/${encodeURIComponent(orderId)}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.error || data.message || 'Unable to fetch live location',
    )
  }

  return data
}

function InfoRow({ label, value }) {
  if (!value) return null

  return (
    <div className="flex justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right break-words">
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    PLACED: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-indigo-50 text-indigo-700',
    PREPARING: 'bg-orange-50 text-orange-700',
    OUT_FOR_DELIVERY: 'bg-red-50 text-red-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  }

  const labels = {
    PLACED: 'Order Placed',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
        styles[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  )
}

export default function TrackOrder() {
  const { state: { lastOrder } } = useApp()

  const [order, setOrder] = useState(lastOrder)
  const [status, setStatus] = useState(lastOrder?.status || 'PLACED')

  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const [tracking, setTracking] = useState(null)
  const [trackingError, setTrackingError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    if (lastOrder) {
      setOrder(lastOrder)
      setStatus(lastOrder.status || 'PLACED')
    }
  }, [lastOrder])

  // Refresh order status every 2 seconds.
  useEffect(() => {
    if (!order?.orderId) return undefined

    let cancelled = false

    const pollStatus = async () => {
      try {
        const res = await pollOrderStatus(order.orderId)

        if (!cancelled && res?.status) {
          setStatus(res.status)
        }
      } catch (error) {
        console.error('TrackOrder: Error polling status:', error)
      }
    }

    pollStatus()

    const id = window.setInterval(pollStatus, 2000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [order?.orderId])

  // Fetch delivery partner's GPS location every 5 seconds.
  useEffect(() => {
    if (!order?.orderId || status !== 'OUT_FOR_DELIVERY') {
      setTracking(null)
      setTrackingError('')
      setLocationLoading(false)
      return undefined
    }

    let cancelled = false
    let requestInProgress = false

    const updateLocation = async () => {
      if (requestInProgress || cancelled) return

      requestInProgress = true
      setLocationLoading(true)

      try {
        const data = await fetchTrackingLocation(order.orderId)

        if (cancelled) return

        setTracking(data)
        setTrackingError('')

        if (data.status && data.status !== status) {
          setStatus(data.status)
        }
      } catch (error) {
        if (!cancelled) {
          setTrackingError(
            error.message || 'Unable to fetch delivery location',
          )
        }
      } finally {
        requestInProgress = false

        if (!cancelled) {
          setLocationLoading(false)
        }
      }
    }

    updateLocation()

    const id = window.setInterval(updateLocation, 5000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [order?.orderId, status])

  async function handleCancelOrder() {
    if (!order?.orderId) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?',
    )

    if (!confirmed) return

    try {
      setCancelLoading(true)
      setCancelError('')

      const result = await cancelOrder(
        order.orderId,
        'Cancelled by customer',
      )

      const updatedOrder =
        result?.order || result?.data?.order || {}

      setOrder(prev => ({
        ...prev,
        ...updatedOrder,
        status: 'CANCELLED',
      }))

      setStatus('CANCELLED')
    } catch (error) {
      setCancelError(
        error.message || 'Unable to cancel this order',
      )
    } finally {
      setCancelLoading(false)
    }
  }

  const location = tracking?.location

  const hasValidLocation =
    location?.latitude !== null &&
    location?.latitude !== undefined &&
    location?.longitude !== null &&
    location?.longitude !== undefined &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude))

  const latitude = hasValidLocation
    ? Number(location.latitude)
    : null

  const longitude = hasValidLocation
    ? Number(location.longitude)
    : null

  const mapUrl = useMemo(() => {
    if (!hasValidLocation) return ''

    const delta = 0.008

    const bbox = [
      longitude - delta,
      latitude - delta,
      longitude + delta,
      latitude + delta,
    ].join('%2C')

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
  }, [hasValidLocation, latitude, longitude])

  if (!order || !order.orderId) {
    return (
      <div className="min-h-screen bg-[#fffdfb] px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm"
        >
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl">
            📦
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">
            No Recent Order
          </h1>

          <p className="mt-2 text-gray-500">
            You haven't placed an order yet. Explore restaurants and order
            your favourite food.
          </p>

          <Link
            to="/restaurants"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-700"
          >
            Explore Restaurants
          </Link>
        </motion.div>
      </div>
    )
  }

  const activeIndex = steps.findIndex(step => step.key === status)
  const currentIndex = activeIndex >= 0 ? activeIndex : 0
  const currentStep = steps[currentIndex]

  return (
    <div className="min-h-screen bg-[#fffdfb] pb-16">
      {/* Page Header */}
      <section className="border-b border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600">
              <span>ApnaMaal</span>
              <span className="text-gray-400">/</span>
              <span>Order Tracking</span>
            </div>

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Track Your Order
                </h1>

                <p className="mt-2 text-gray-600">
                  Stay updated while we bring happiness to your doorstep.
                </p>

                <p className="mt-3 text-sm text-gray-500">
                  Order ID:{' '}
                  <span className="font-mono font-bold text-gray-900">
                    {order.orderId}
                  </span>
                </p>
              </div>

              <StatusBadge status={status} />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Current Status Banner */}
        {status !== 'CANCELLED' && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 p-6 text-white shadow-lg shadow-red-100 sm:flex-row sm:items-center"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-4xl">
              {currentStep?.icon || '📦'}
            </div>

            <div>
              <p className="text-sm font-medium text-red-100">
                Current Order Status
              </p>

              <h2 className="mt-1 text-2xl font-extrabold">
                {currentStep?.label || status}
              </h2>

              <p className="mt-1 text-sm text-red-100">
                {currentStep?.description || 'Your order is being processed.'}
              </p>
            </div>

            <div className="sm:ml-auto sm:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Live Updates
              </span>
              <p className="mt-2 text-xs text-red-100">
                Status refreshes automatically
              </p>
            </div>
          </motion.div>
        )}

        {/* Order Progress */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-7 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-7">
            <h2 className="text-xl font-extrabold text-gray-900">
              Order Journey
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Follow each step until your order reaches you.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-6 hidden h-[calc(100%-48px)] w-1 rounded-full bg-gray-100 sm:left-0 sm:right-0 sm:top-7 sm:block sm:h-1 sm:w-full" />

            <div
              className="absolute left-5 top-6 hidden w-1 rounded-full bg-red-500 sm:left-0 sm:right-auto sm:top-7 sm:block sm:h-1 sm:w-auto"
              style={{
                width: `${(currentIndex / (steps.length - 1)) * 100}%`,
              }}
            />

            <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-5 sm:gap-3">
              {steps.map((step, index) => {
                const isActive = index <= currentIndex
                const isCurrent = index === currentIndex

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center"
                  >
                    <div
                      className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-xl transition ${
                        isActive
                          ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-100'
                          : 'border-gray-200 bg-white text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-red-100' : ''}`}
                    >
                      {step.icon}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isActive ? 'text-red-600' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {isCurrent
                          ? 'Current step'
                          : isActive
                            ? 'Completed'
                            : 'Upcoming'}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-5">
          {/* Left Column */}
          <div className="space-y-7 lg:col-span-3">
            {/* Live Tracking */}
            {status === 'OUT_FOR_DELIVERY' && (
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      Live Delivery Tracking
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Delivery partner location refreshes every 5 seconds.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    Tracking Active
                  </span>
                </div>

                {tracking?.deliveryPartner && (
                  <div className="flex items-center gap-4 border-b border-gray-100 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
                      🛵
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">
                        {tracking.deliveryPartner.name || 'Delivery Partner'}
                      </p>

                      <p className="text-xs text-gray-500">
                        Your delivery partner
                      </p>
                    </div>

                    {tracking.deliveryPartner.phone && (
                      <a
                        href={`tel:${tracking.deliveryPartner.phone}`}
                        className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Call
                      </a>
                    )}
                  </div>
                )}

                {hasValidLocation ? (
                  <>
                    <iframe
                      title="Live delivery partner location"
                      src={mapUrl}
                      className="h-80 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />

                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-500">
                          LIVE GPS COORDINATES
                        </p>
                        <p className="mt-1 font-mono text-xs text-gray-800">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {location?.updatedAt
                            ? `Last updated: ${new Date(
                                location.updatedAt,
                              ).toLocaleTimeString()}`
                            : 'Location received'}
                        </p>
                      </div>

                      <a
                        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-red-600 hover:text-red-700"
                      >
                        Open Larger Map ↗
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-64 items-center justify-center p-8 text-center">
                    <div>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
                        📍
                      </div>

                      <h3 className="font-bold text-gray-900">
                        {trackingError
                          ? 'Unable to load delivery location'
                          : locationLoading
                            ? 'Fetching delivery partner location...'
                            : 'Waiting for GPS Location'}
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                        {trackingError ||
                          'The map will appear as soon as your delivery partner shares their location.'}
                      </p>

                      {locationLoading && (
                        <div className="mx-auto mt-5 h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                      )}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* Cancellation */}
            {(status === 'PLACED' || status === 'CONFIRMED') && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                    ⚠️
                  </div>

                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-900">
                      Need to cancel?
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      You can request cancellation before restaurant
                      preparation begins.
                    </p>
                  </div>
                </div>

                {cancelError && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {cancelError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                  className="mt-5 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </motion.section>
            )}

            {/* Cancelled */}
            {status === 'CANCELLED' && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl">
                  ❌
                </div>

                <h2 className="text-2xl font-extrabold text-red-700">
                  Order Cancelled
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  This order has been cancelled. We hope to serve you again.
                </p>
              </motion.section>
            )}

            {/* Delivered */}
            {status === 'DELIVERED' && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-5xl">
                  🎉
                </div>

                <h2 className="text-3xl font-extrabold">
                  Order Delivered!
                </h2>

                <p className="mt-2 text-green-50">
                  Your food has arrived. Enjoy your meal!
                </p>

                <p className="mt-4 text-sm font-semibold text-green-50">
                  Thank you for choosing ApnaMaal ❤️
                </p>
              </motion.section>
            )}

            {/* Order Information */}
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-extrabold text-gray-900">
                Delivery Information
              </h2>

              <InfoRow
                label="Order ID"
                value={order.orderId}
              />

              <InfoRow
                label="Delivery Address"
                value={order.address}
              />

              <InfoRow
                label="Payment Method"
                value={order.paymentMethod}
              />

              <InfoRow
                label="Estimated Delivery"
                value={
                  order.etaMinutes
                    ? `${order.etaMinutes} minutes`
                    : null
                }
              />

              {order.scheduled && (
                <InfoRow
                  label="Scheduled Delivery"
                  value={`${order.scheduleDate || ''} ${order.scheduleTime || ''}`}
                />
              )}
            </section>
          </div>

          {/* Right Column */}
          <aside className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900">
                Order Summary
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your order at a glance.
              </p>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="mt-5 space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={item._id || item.id || index}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
                          {item.quantity || 1}x
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {item.name || item.title || 'Food Item'}
                          </p>

                          {item.variant && (
                            <p className="text-xs text-gray-400">
                              {item.variant}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-gray-900">
                        ₹{(
                          Number(item.price || 0) *
                          Number(item.quantity || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {order.total !== undefined && (
                <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-600">
                      Total Amount
                    </span>

                    <span className="text-xl font-extrabold text-red-600">
                      ₹{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-[#fff1ed] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  ❤️
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-900">
                    Made with care
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fresh food, happy moments.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">
                Thank you for ordering with ApnaMaal. We're working to make
                your food delivery experience smooth and delightful.
              </p>

              <Link
                to="/restaurants"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Explore More Restaurants
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
