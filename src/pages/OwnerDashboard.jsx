
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import {
  fetchOwnerRestaurants,
  createRestaurantForOwner,
  fetchRestaurantOrders,
  fetchDeliveryBoys,
  respondToOwnerOrder,
  assignDeliveryPartner,
  updateRestaurant,
  setRestaurantOffer,
  fetchMenuByRestaurantId,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../services/api'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100'

const primaryButton =
  'rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButton =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50'

function StatusBadge({ status }) {
  const styles = {
    PLACED: 'bg-amber-50 text-amber-700',
    CONFIRMED: 'bg-blue-50 text-blue-700',
    PREPARING: 'bg-purple-50 text-purple-700',
    OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
    PENDING: 'bg-amber-50 text-amber-700',
    ACCEPTED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700'
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {(status || 'UNKNOWN').replaceAll('_', ' ')}
    </span>
  )
}

function StatCard({ icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-900">{value}</h3>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const { state: { user } } = useApp()
  const ownerId = user?._id || user?.id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [restaurants, setRestaurants] = useState([])
  const activeRestaurant = restaurants[0] || null
  const activeRestaurantId = activeRestaurant?._id || activeRestaurant?.id

  const [orders, setOrders] = useState([])
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [selectedDeliveryPartners, setSelectedDeliveryPartners] = useState({})

  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    image: '',
    cuisine: '',
    description: '',
    deliveryTime: 30,
    costForTwo: 500,
    address: { street: '', city: '', state: '', pincode: '' }
  })

  const [offer, setOffer] = useState('')

  const [menu, setMenu] = useState([])
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    veg: null
  })

  const [activeTab, setActiveTab] = useState('orders')
  const canUse = useMemo(() => !!ownerId, [ownerId])

  const availablePartners = deliveryBoys.filter(
    boy =>
      boy.kycStatus === 'APPROVED' &&
      boy.status === 'AVAILABLE' &&
      !boy.currentOrderId
  )

  const pendingOrders = orders.filter(order => order.status === 'PLACED').length
  const activeOrders = orders.filter(order =>
    ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)
  ).length
  const deliveredOrders = orders.filter(order => order.status === 'DELIVERED').length

  function showSuccess(message) {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  useEffect(() => {
    if (!canUse) return

    let isMounted = true

    async function loadOwnerData() {
      try {
        setLoading(true)
        setError('')

        const list = await fetchOwnerRestaurants(ownerId)
        if (!isMounted) return

        setRestaurants(list || [])

        if ((list || []).length > 0) {
          const restaurant = list[0]

          setRestaurantForm({
            name: restaurant.name || '',
            image: restaurant.image || '',
            cuisine: restaurant.cuisine || '',
            description: restaurant.description || '',
            deliveryTime: restaurant.deliveryTime || 30,
            costForTwo: restaurant.costForTwo || 500,
            address: restaurant.address || {
              street: '',
              city: '',
              state: '',
              pincode: ''
            }
          })

          setOffer(restaurant.offer || '')

          const items = await fetchMenuByRestaurantId(
            restaurant._id || restaurant.id
          )

          if (isMounted) setMenu(items || [])
        }
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load dashboard')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadOwnerData()

    return () => {
      isMounted = false
    }
  }, [canUse, ownerId])

  useEffect(() => {
    if (!activeRestaurantId) {
      setOrders([])
      setDeliveryBoys([])
      return
    }

    let isMounted = true

    async function loadOrderManagement() {
      try {
        setOrderLoading(true)

        const [restaurantOrders, partners] = await Promise.all([
          fetchRestaurantOrders(activeRestaurantId),
          fetchDeliveryBoys()
        ])

        if (!isMounted) return

        setOrders(restaurantOrders || [])
        setDeliveryBoys(partners || [])
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load orders')
      } finally {
        if (isMounted) setOrderLoading(false)
      }
    }

    loadOrderManagement()

    return () => {
      isMounted = false
    }
  }, [activeRestaurantId])

  async function handleCreateOrUpdateRestaurant() {
    if (!canUse) return

    try {
      setLoading(true)
      setError('')

      if (!activeRestaurant) {
        const created = await createRestaurantForOwner(ownerId, restaurantForm)
        setRestaurants([created])
        showSuccess('Restaurant created successfully')
      } else {
        const updated = await updateRestaurant(
          activeRestaurantId,
          restaurantForm
        )
        setRestaurants([updated])
        showSuccess('Restaurant details updated')
      }
    } catch (e) {
      setError(e.message || 'Failed to save restaurant')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveOffer() {
    if (!activeRestaurant) return

    try {
      setLoading(true)
      setError('')

      const result = await setRestaurantOffer(activeRestaurantId, {
        offer,
        ownerId
      })

      setRestaurants([result])
      showSuccess('Restaurant offer updated')
    } catch (e) {
      setError(e.message || 'Failed to save offer')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMenuItem() {
    if (!activeRestaurant) return

    try {
      setLoading(true)
      setError('')

      const item = await addMenuItem(
        activeRestaurantId,
        menuForm,
        ownerId
      )

      setMenu(prev => [item, ...prev])
      setMenuForm({
        name: '',
        description: '',
        price: 0,
        image: '',
        category: '',
        veg: null
      })

      showSuccess('Menu item added successfully')
    } catch (e) {
      setError(e.message || 'Failed to add menu item')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateMenuItem(itemId, updates) {
    if (!activeRestaurant) return

    try {
      setLoading(true)
      setError('')

      const updated = await updateMenuItem(
        activeRestaurantId,
        itemId,
        updates,
        ownerId
      )

      setMenu(prev =>
        prev.map(item =>
          String(item._id || item.id) === String(itemId) ? updated : item
        )
      )

      showSuccess('Menu item updated')
    } catch (e) {
      setError(e.message || 'Failed to update menu item')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteMenuItem(itemId) {
    if (!activeRestaurant) return

    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    try {
      setLoading(true)
      setError('')

      await deleteMenuItem(activeRestaurantId, itemId, ownerId)

      setMenu(prev =>
        prev.filter(item => String(item._id || item.id) !== String(itemId))
      )

      showSuccess('Menu item deleted')
    } catch (e) {
      setError(e.message || 'Failed to delete menu item')
    } finally {
      setLoading(false)
    }
  }

  async function refreshOrders() {
    if (!activeRestaurantId) return

    try {
      setOrderLoading(true)
      const [updatedOrders, partners] = await Promise.all([
        fetchRestaurantOrders(activeRestaurantId),
        fetchDeliveryBoys()
      ])

      setOrders(updatedOrders || [])
      setDeliveryBoys(partners || [])
    } catch (e) {
      setError(e.message || 'Unable to refresh orders')
    } finally {
      setOrderLoading(false)
    }
  }

  async function handleOwnerOrderResponse(orderId, action) {
    let reason = ''

    if (action === 'REJECT') {
      const enteredReason = window.prompt('Please enter rejection reason:')

      if (enteredReason === null) return

      reason = enteredReason.trim()

      if (!reason) {
        setError('Rejection reason is required')
        return
      }
    }

    try {
      setOrderLoading(true)
      setError('')

      await respondToOwnerOrder(orderId, action, reason)
      await refreshOrders()

      showSuccess(action === 'ACCEPT' ? 'Order accepted' : 'Order rejected')
    } catch (e) {
      setError(e.message || 'Failed to update order')
    } finally {
      setOrderLoading(false)
    }
  }

  async function handleAssignDelivery(orderId) {
    const deliveryBoyId = selectedDeliveryPartners[orderId]

    if (!deliveryBoyId) {
      setError('Please select a delivery partner')
      return
    }

    try {
      setOrderLoading(true)
      setError('')

      await assignDeliveryPartner(orderId, deliveryBoyId)
      await refreshOrders()

      setSelectedDeliveryPartners(prev => ({
        ...prev,
        [orderId]: ''
      }))

      showSuccess('Delivery partner assigned')
    } catch (e) {
      setError(e.message || 'Failed to assign delivery partner')
    } finally {
      setOrderLoading(false)
    }
  }

  function updateAddress(field, value) {
    setRestaurantForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'restaurant', label: 'Restaurant Profile', icon: '🏪' },
    { id: 'offer', label: 'Offers', icon: '🎁' },
    { id: 'menu', label: 'Menu Management', icon: '🍽️' }
  ]

  if (!canUse) {
    return (
      <div className="min-h-screen bg-[#fffdfb] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
            Owner Access Required
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please login with your restaurant owner account to access this dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffdfb] pb-12">
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-red-100">
                APNAMAAL PARTNER PANEL
              </p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Owner Dashboard
              </h1>
              <p className="mt-2 text-sm text-red-100">
                Manage your restaurant, orders and menu from one place.
              </p>
              {activeRestaurant && (
                <p className="mt-3 text-sm font-semibold">
                  🏪 {activeRestaurant.name}
                </p>
              )}
            </div>

            <button
              onClick={refreshOrders}
              disabled={orderLoading || !activeRestaurant}
              className="rounded-xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-50"
            >
              {orderLoading ? 'Refreshing...' : '↻ Refresh Orders'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            ✓ {success}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="📦"
            label="Total Orders"
            value={orders.length}
            description="Orders received by your restaurant"
          />
          <StatCard
            icon="🔔"
            label="New Orders"
            value={pendingOrders}
            description="Waiting for your response"
          />
          <StatCard
            icon="🍳"
            label="Active Orders"
            value={activeOrders}
            description="Currently being processed"
          />
          <StatCard
            icon="✅"
            label="Delivered"
            value={deliveredOrders}
            description="Successfully completed orders"
          />
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <section className="mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Order Management
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review customer orders and manage delivery assignments.
                </p>
              </div>
              <button
                onClick={refreshOrders}
                disabled={orderLoading}
                className={secondaryButton}
              >
                {orderLoading ? 'Loading...' : '↻ Refresh'}
              </button>
            </div>

            {orderLoading && orders.length === 0 && (
              <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
                Loading orders...
              </div>
            )}

            {!orderLoading && orders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                <div className="text-5xl">🛍️</div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  No orders yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  New customer orders will appear here.
                </p>
              </div>
            )}

            <div className="space-y-5">
              {orders.map((order, index) => {
                const orderId = order._id || order.id
                const partner = order.deliveryBoyId
                const partnerId =
                  typeof partner === 'object' ? partner?._id : partner

                return (
                  <motion.div
                    key={orderId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.2) }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Order ID
                        </p>
                        <h3 className="mt-1 font-extrabold text-gray-900">
                          #{order.orderId || orderId}
                        </h3>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
                      <div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-[#fff8f6] p-3">
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="mt-1 font-semibold text-gray-900">
                              {order.userId?.name || 'Customer'}
                            </p>
                            {order.userId?.phone && (
                              <p className="mt-1 text-xs text-gray-500">
                                {order.userId.phone}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl bg-[#fff8f6] p-3">
                            <p className="text-xs text-gray-500">Payment</p>
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
                            {order.address || 'Address not available'}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Order Items
                          </p>
                          <div className="mt-2 space-y-2">
                            {order.items?.map((item, itemIndex) => (
                              <div
                                key={item._id || itemIndex}
                                className="flex justify-between gap-3 text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ₹{(item.price || 0) * (item.quantity || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                          <span className="font-semibold text-gray-700">
                            Order Total
                          </span>
                          <span className="text-xl font-extrabold text-red-600">
                            ₹{order.pricing?.total ?? order.totalAmount ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <p className="font-bold text-gray-900">
                          Order Actions
                        </p>

                        {order.status === 'PLACED' && (
                          <div className="mt-4 space-y-2">
                            <button
                              onClick={() =>
                                handleOwnerOrderResponse(orderId, 'ACCEPT')
                              }
                              disabled={orderLoading}
                              className={`${primaryButton} w-full`}
                            >
                              ✓ Accept Order
                            </button>
                            <button
                              onClick={() =>
                                handleOwnerOrderResponse(orderId, 'REJECT')
                              }
                              disabled={orderLoading}
                              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              ✕ Reject Order
                            </button>
                          </div>
                        )}

                        {['CONFIRMED', 'PREPARING'].includes(order.status) &&
                          !['PENDING', 'ACCEPTED'].includes(order.deliveryAssignmentStatus) && (
                            <div className="mt-4 space-y-3">
                              <label className="text-xs font-bold text-gray-500">
                                SELECT DELIVERY PARTNER
                              </label>

                              <select
                                value={selectedDeliveryPartners[orderId] || ''}
                                onChange={e =>
                                  setSelectedDeliveryPartners(prev => ({
                                    ...prev,
                                    [orderId]: e.target.value
                                  }))
                                }
                                className={inputClass}
                              >
                                <option value="">Choose partner</option>
                                {availablePartners.map(boy => (
                                  <option key={boy._id} value={boy._id}>
                                    {boy.name} - {boy.phone}
                                  </option>
                                ))}
                              </select>

                              {availablePartners.length === 0 && (
                                <p className="text-xs text-amber-700">
                                  No approved and available delivery partners right now.
                                </p>
                              )}

                              <button
                                onClick={() => handleAssignDelivery(orderId)}
                                disabled={orderLoading || availablePartners.length === 0}
                                className={`${primaryButton} w-full`}
                              >
                                Assign Partner
                              </button>
                            </div>
                          )}

                        {order.deliveryAssignmentStatus && (
                          <div className="mt-4 border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-500">
                              Delivery Assignment
                            </p>
                            <div className="mt-2">
                              <StatusBadge status={order.deliveryAssignmentStatus} />
                            </div>
                          </div>
                        )}

                        {partner && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500">
                              Assigned Delivery Partner
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {typeof partner === 'object'
                                ? partner.name
                                : 'Partner assigned'}
                            </p>
                            {typeof partner === 'object' && partner.phone && (
                              <p className="text-xs text-gray-500">
                                {partner.phone}
                              </p>
                            )}
                          </div>
                        )}

                        {partnerId && (
                          <p className="mt-2 text-xs text-green-700">
                            Partner linked to this order
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {activeTab === 'restaurant' && (
          <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">
                {activeRestaurant ? 'Restaurant Profile' : 'Create Restaurant'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Keep your restaurant information up to date.
              </p>
            </div>

            {activeRestaurant?.image && (
              <img
                src={activeRestaurant.image}
                alt={activeRestaurant.name}
                className="mb-6 h-48 w-full rounded-2xl object-cover sm:h-56"
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Restaurant Name</label>
                <input className={inputClass} placeholder="Restaurant name" value={restaurantForm.name} onChange={e => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Cuisine</label>
                <input className={inputClass} placeholder="e.g. North Indian, Chinese" value={restaurantForm.cuisine} onChange={e => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Restaurant Image URL</label>
                <input className={inputClass} placeholder="https://..." value={restaurantForm.image} onChange={e => setRestaurantForm({ ...restaurantForm, image: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Delivery Time (minutes)</label>
                <input className={inputClass} type="number" min="1" value={restaurantForm.deliveryTime} onChange={e => setRestaurantForm({ ...restaurantForm, deliveryTime: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Cost for Two (₹)</label>
                <input className={inputClass} type="number" min="0" value={restaurantForm.costForTwo} onChange={e => setRestaurantForm({ ...restaurantForm, costForTwo: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
                <textarea className={inputClass} rows={4} placeholder="Tell customers about your restaurant..." value={restaurantForm.description} onChange={e => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
              </div>
            </div>

            <div className="mt-7 border-t border-gray-100 pt-6">
              <h3 className="mb-4 font-bold text-gray-900">Restaurant Address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={inputClass} placeholder="Street" value={restaurantForm.address.street || ''} onChange={e => updateAddress('street', e.target.value)} />
                <input className={inputClass} placeholder="City" value={restaurantForm.address.city || ''} onChange={e => updateAddress('city', e.target.value)} />
                <input className={inputClass} placeholder="State" value={restaurantForm.address.state || ''} onChange={e => updateAddress('state', e.target.value)} />
                <input className={inputClass} placeholder="Pincode" value={restaurantForm.address.pincode || ''} onChange={e => updateAddress('pincode', e.target.value)} />
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleCreateOrUpdateRestaurant}
              className={`${primaryButton} mt-6`}
            >
              {loading ? 'Saving...' : activeRestaurant ? 'Save Restaurant Changes' : 'Create Restaurant'}
            </button>
          </section>
        )}

        {activeTab === 'offer' && (
          <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">
                Restaurant Offers
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add an offer to highlight your restaurant to customers.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white">
              <p className="text-sm font-semibold text-red-100">CURRENT OFFER</p>
              <h3 className="mt-2 text-2xl font-extrabold">
                {offer || 'No active offer'}
              </h3>
              <p className="mt-2 text-sm text-red-100">
                Your offer text will be saved to your restaurant profile.
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Offer Text
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Flat ₹100 off on orders above ₹499"
                value={offer}
                onChange={e => setOffer(e.target.value)}
              />
            </div>

            <button
              disabled={loading || !activeRestaurant}
              onClick={handleSaveOffer}
              className={`${primaryButton} mt-4`}
            >
              {loading ? 'Saving...' : 'Save Offer'}
            </button>

            {!activeRestaurant && (
              <p className="mt-3 text-sm text-amber-700">
                Create your restaurant profile before adding an offer.
              </p>
            )}
          </section>
        )}

        {activeTab === 'menu' && (
          <section className="mt-6 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-2xl font-extrabold text-gray-900">
                Add Menu Item
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add dishes customers can order from your restaurant.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input className={inputClass} placeholder="Item name" value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} />
                <input className={inputClass} placeholder="Category (e.g. Starters)" value={menuForm.category} onChange={e => setMenuForm({ ...menuForm, category: e.target.value })} />
                <input className={inputClass} type="number" min="0" placeholder="Price (₹)" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: Number(e.target.value) })} />
                <input className={inputClass} placeholder="Image URL" value={menuForm.image} onChange={e => setMenuForm({ ...menuForm, image: e.target.value })} />
                <div className="sm:col-span-2">
                  <textarea className={inputClass} rows={3} placeholder="Describe this dish..." value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Food Type</label>
                  <select
                    className={inputClass}
                    value={menuForm.veg === null ? '' : menuForm.veg ? 'veg' : 'nonveg'}
                    onChange={e => setMenuForm({
                      ...menuForm,
                      veg: e.target.value === '' ? null : e.target.value === 'veg'
                    })}
                  >
                    <option value="">Both / Not specified</option>
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <button
                disabled={loading || !activeRestaurant}
                onClick={handleAddMenuItem}
                className={`${primaryButton} mt-5`}
              >
                {loading ? 'Please wait...' : '+ Add Menu Item'}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Your Menu
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {menu.length} menu items
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                  {menu.length} Items
                </span>
              </div>

              {menu.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-5xl">🍽️</div>
                  <p className="mt-3 font-bold text-gray-800">No menu items yet</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add your first dish using the form above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {menu.map(item => {
                    const itemId = item._id || item.id
                    const isAvailable = item.available ?? true

                    return (
                      <div
                        key={itemId}
                        className="flex flex-wrap items-center gap-4 py-4"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-2xl">
                            🍛
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.veg === null ? 'bg-gray-100 text-gray-600' : item.veg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {item.veg === null ? 'Both' : item.veg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.category || 'Uncategorized'}
                          </p>
                          <p className="mt-1 font-bold text-red-600">₹{item.price}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            disabled={loading}
                            onClick={() =>
                              handleUpdateMenuItem(itemId, {
                                available: !isAvailable
                              })
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                              isAvailable
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isAvailable ? '● Available' : '○ Disabled'}
                          </button>
                          <button
                            disabled={loading}
                            onClick={() => handleDeleteMenuItem(itemId)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {loading && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Updating dashboard...
          </p>
        )}
      </div>
    </div>
  )
}
