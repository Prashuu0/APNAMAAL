import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const tabs = ['Overview', 'Orders', 'Users', 'Restaurants', 'Delivery KYC']
// API helper
async function adminApi(endpoint, options = {}) {
  const token = localStorage.getItem('apnamaal_token')
  if (!token) {
    throw new Error('Login token not found. Please login again.')
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Invalid response from ${endpoint}`)
  }
  if (!response.ok) {
    throw new Error(
      data.message || data.error || `API failed: ${endpoint}`
    )
  }
  return data
}
// Handles different API response formats
function extractList(data, keys = []) {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  if (Array.isArray(data?.data)) return data.data
  for (const key of keys) {
    if (Array.isArray(data?.data?.[key])) {
      return data.data[key]
    }
  }
  return []
}
function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}
function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-IN')
}
// Status badge
function StatusBadge({ status }) {
  const colors = {
    PLACED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-indigo-100 text-indigo-700',
    PREPARING: 'bg-yellow-100 text-yellow-700',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    AVAILABLE: 'bg-green-100 text-green-700',
    BUSY: 'bg-yellow-100 text-yellow-700',
    OFFLINE: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-green-100 text-green-700',
    CLOSED: 'bg-red-100 text-red-700',
    ACTIVE: 'bg-green-100 text-green-700',
    BLOCKED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  const normalizedStatus = status || 'N/A'
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        colors[normalizedStatus] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {normalizedStatus.replaceAll('_', ' ')}
    </span>
  )
}
// Statistics card
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <span className={`text-2xl ${color}`}>{icon}</span>
      </div>
      <h2 className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">
        {value ?? 0}
      </h2>
    </div>
  )
}
// Reusable table
function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-5 py-4 text-sm font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
// Reusable details modal
function DetailsModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
// Main Admin Dashboard
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [overview, setOverview] = useState({})
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [deliveryPartners, setDeliveryPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    const requests = [
      {
        name: 'Overview',
        endpoint: '/orders/admin/overview',
      },
      {
        name: 'Orders',
        endpoint: '/orders/admin/all',
      },
      {
        name: 'Users',
        endpoint: '/users/admin/all',
      },
      {
        name: 'Restaurants',
        endpoint: '/restaurants',
      },
      {
        name: 'Delivery KYC',
        endpoint: '/delivery/admin/kyc',
      },
    ]
    const results = await Promise.allSettled(
      requests.map((request) => adminApi(request.endpoint))
    )
    const errors = []
    results.forEach((result, index) => {
      const name = requests[index].name
      if (result.status === 'rejected') {
        errors.push(`${name}: ${result.reason.message}`)
        return
      }
      const data = result.value
      if (name === 'Overview') {
        setOverview(
          data.overview || data.data?.overview || data.data || data
        )
      }
      if (name === 'Orders') {
        setOrders(extractList(data, ['orders']))
      }
      if (name === 'Users') {
        setUsers(extractList(data, ['users']))
      }
      if (name === 'Restaurants') {
        setRestaurants(extractList(data, ['restaurants']))
      }
      if (name === 'Delivery KYC') {
        setDeliveryPartners(extractList(data, ['deliveryBoys', 'deliveryPartners']))
      }
    })
    if (errors.length > 0) {
      setError(errors.join(' | '))
    }
    setLoading(false)
  }, [])
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleUserStatusChange = async (userId, isActive) => {
    const data = await adminApi(`/users/admin/${userId}/status`, {
      method: 'PATCH',
      body: { isActive },
    })

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user._id === userId ? data.user : user
      )
    )

    return data.user
  }

  const handleDeliveryKycChange = async (deliveryBoyId, status, rejectionReason = '') => {
    const data = await adminApi(`/delivery/${deliveryBoyId}/kyc`, {
      method: 'PATCH',
      body: { status, rejectionReason },
    })

    setDeliveryPartners((currentPartners) =>
      currentPartners.map((partner) =>
        partner._id === deliveryBoyId
          ? { ...partner, ...data.deliveryBoy }
          : partner
      )
    )

    return data.deliveryBoy
  }

  const stats = [
    {
      title: 'Total Users',
      value: overview.totalUsers,
      icon: '👥',
      color: 'text-blue-500',
    },
    {
      title: 'Restaurants',
      value: overview.totalRestaurants,
      icon: '🍽️',
      color: 'text-red-500',
    },
    {
      title: 'Delivery Partners',
      value: overview.totalDeliveryPartners,
      icon: '🛵',
      color: 'text-purple-500',
    },
    {
      title: 'Total Orders',
      value: overview.totalOrders,
      icon: '📦',
      color: 'text-green-500',
    },
    {
      title: 'Delivered Orders',
      value: overview.deliveredOrders,
      icon: '✅',
      color: 'text-green-600',
    },
    {
      title: 'Cancelled Orders',
      value: overview.cancelledOrders,
      icon: '❌',
      color: 'text-red-500',
    },
    {
      title: 'Active Orders',
      value: overview.activeOrders,
      icon: '🚚',
      color: 'text-yellow-500',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue),
      icon: '💰',
      color: 'text-emerald-500',
    },
  ]
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-red-500 font-semibold">
              APNA MAAL ADMIN PANEL
            </p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your platform from one place.
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-xl font-semibold transition ${
                activeTab === tab
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* API Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            <p className="font-semibold">Some dashboard data could not load:</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Loading dashboard data...
          </div>
        )}
        {/* Overview */}
        {activeTab === 'Overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </motion.div>
        )}
        {/* Orders */}
        {activeTab === 'Orders' && (
          <OrderManagement orders={orders} />
        )}
        {/* Users */}
        {activeTab === 'Users' && (
          <UserManagement users={users} onStatusChange={handleUserStatusChange} />
        )}
        {/* Restaurants */}
        {activeTab === 'Restaurants' && (
          <RestaurantManagement restaurants={restaurants} />
        )}

        {activeTab === 'Delivery KYC' && (
          <DeliveryKYCManagement
            deliveryPartners={deliveryPartners}
            onKycChange={handleDeliveryKycChange}
          />
        )}
      </div>
    </div>
  )
}
// ORDERS MANAGEMENT
function OrderManagement({ orders }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const statuses = [
    'ALL',
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]
  const filteredOrders = orders.filter((order) => {
    const searchText = search.toLowerCase()
    const orderId = String(order.orderId || order._id || '').toLowerCase()
    const customer = String(order.userId?.name || '').toLowerCase()
    const restaurant = String(order.restaurantId?.name || '').toLowerCase()
    const matchesSearch =
      orderId.includes(searchText) ||
      customer.includes(searchText) ||
      restaurant.includes(searchText)
    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders Management
        </h2>
        <p className="text-gray-500 mt-1">
          Search and monitor all platform orders.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search Order ID, Customer or Restaurant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All Orders' : status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>
      <DataTable
        columns={[
          'Order ID',
          'Customer',
          'Restaurant',
          'Amount',
          'Status',
          'Action',
        ]}
        rows={filteredOrders.map((order) => [
          order.orderId || order._id,
          order.userId?.name || 'N/A',
          order.restaurantId?.name || 'N/A',
          formatCurrency(order.pricing?.total ?? order.total),
          <StatusBadge status={order.status} />,
          <button
            onClick={() => setSelectedOrder(order)}
            className="text-red-500 font-semibold hover:text-red-600"
          >
            View Details
          </button>,
        ])}
      />
      {selectedOrder && (
        <DetailsModal
          title="Order Details"
          onClose={() => setSelectedOrder(null)}
        >
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Order ID:</strong>{' '}
              {selectedOrder.orderId || selectedOrder._id}
            </p>
            <p>
              <strong>Customer:</strong>{' '}
              {selectedOrder.userId?.name || 'N/A'}
            </p>
            <p>
              <strong>Restaurant:</strong>{' '}
              {selectedOrder.restaurantId?.name || 'N/A'}
            </p>
            <p>
              <strong>Address:</strong>{' '}
              {typeof selectedOrder.address === 'string'
                ? selectedOrder.address
                : 'N/A'}
            </p>
            <p>
              <strong>Payment:</strong>{' '}
              {selectedOrder.paymentMethod || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <StatusBadge status={selectedOrder.status} />
            </p>
            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold mb-3">Ordered Items</h3>
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex justify-between py-2">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {formatCurrency(
                      (item.price || 0) * (item.quantity || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <p>
                Subtotal: {formatCurrency(selectedOrder.pricing?.subtotal)}
              </p>
              <p>
                Delivery Fee: {formatCurrency(selectedOrder.pricing?.deliveryFee)}
              </p>
              <p>
                Tax: {formatCurrency(selectedOrder.pricing?.tax)}
              </p>
              <p>
                Discount: {formatCurrency(selectedOrder.pricing?.discount)}
              </p>
              <p className="text-lg font-bold">
                Total:{' '}
                {formatCurrency(
                  selectedOrder.pricing?.total ?? selectedOrder.total
                )}
              </p>
            </div>
          </div>
        </DetailsModal>
      )}
    </div>
  )
}
// USERS MANAGEMENT
function UserManagement({ users, onStatusChange }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const roleLabels = {
    user: 'Customer',
    restaurant_owner: 'Restaurant Owner',
    delivery: 'Delivery Partner',
    admin: 'Admin',
  }

  const handleToggleStatus = async (user) => {
    if (!user._id || user.role === 'admin') return

    const nextStatus = user.isActive === false
    const action = nextStatus ? 'unblock' : 'block'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    )

    if (!confirmed) return

    try {
      setUpdatingUserId(user._id)
      const updatedUser = await onStatusChange(user._id, nextStatus)

      if (selectedUser?._id === user._id) {
        setSelectedUser(updatedUser)
      }
    } catch (error) {
      window.alert(error.message || 'Failed to update user status')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      String(user.name || '').toLowerCase().includes(searchText) ||
      String(user.email || '').toLowerCase().includes(searchText) ||
      String(user.phone || '').toLowerCase().includes(searchText)

    const matchesRole =
      roleFilter === 'ALL' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Users Management
        </h2>
        <p className="text-gray-500 mt-1">
          View and manage all registered accounts.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone..."
          className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="ALL">All Roles</option>
          <option value="user">Customer</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="delivery">Delivery Partner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} accounts
      </p>

      <DataTable
        columns={['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action']}
        rows={filteredUsers.map((user) => [
          user.name || 'N/A',
          user.email || 'N/A',
          user.phone || 'N/A',
          roleLabels[user.role] || user.role || 'N/A',
          <StatusBadge status={user.isActive === false ? 'BLOCKED' : 'ACTIVE'} />,
          formatDate(user.createdAt),
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUser(user)}
              className="text-red-500 font-semibold hover:text-red-600"
            >
              View
            </button>
            {user.role !== 'admin' && (
              <button
                onClick={() => handleToggleStatus(user)}
                disabled={updatingUserId === user._id}
                className={`font-semibold disabled:opacity-50 ${
                  user.isActive === false
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-red-500 hover:text-red-600'
                }`}
              >
                {updatingUserId === user._id
                  ? 'Updating...'
                  : user.isActive === false
                    ? 'Unblock'
                    : 'Block'}
              </button>
            )}
          </div>,
        ])}
      />

      {selectedUser && (
        <DetailsModal
          title="User Details"
          onClose={() => setSelectedUser(null)}
        >
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-semibold">{selectedUser.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-semibold">{selectedUser.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold">{selectedUser.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-semibold">
                {roleLabels[selectedUser.role] || selectedUser.role}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Account Status</p>
              <StatusBadge
                status={selectedUser.isActive === false ? 'BLOCKED' : 'ACTIVE'}
              />
            </div>
            <div>
              <p className="text-gray-500">Registration Date</p>
              <p className="font-semibold">
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleString('en-IN')
                  : 'N/A'}
              </p>
            </div>
            {selectedUser.role !== 'admin' && (
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={updatingUserId === selectedUser._id}
                className={`w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 ${
                  selectedUser.isActive === false
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {updatingUserId === selectedUser._id
                  ? 'Updating...'
                  : selectedUser.isActive === false
                    ? 'Unblock Account'
                    : 'Block Account'}
              </button>
            )}
          </div>
        </DetailsModal>
      )}
    </div>
  )
}

// RESTAURANT MANAGEMENT
function RestaurantManagement({ restaurants }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchText = search.toLowerCase()
    const name = String(restaurant.name || '').toLowerCase()
    const cuisine = String(restaurant.cuisine || '').toLowerCase()
    const address =
      typeof restaurant.address === 'string'
        ? restaurant.address.toLowerCase()
        : [
            restaurant.address?.street,
            restaurant.address?.city,
            restaurant.address?.state,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
    const matchesSearch =
      name.includes(searchText) ||
      cuisine.includes(searchText) ||
      address.includes(searchText)
    const isOpen = restaurant.isOpen !== false
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OPEN' && isOpen) ||
      (statusFilter === 'CLOSED' && !isOpen)
    return matchesSearch && matchesStatus
  })
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Restaurant Management
        </h2>
        <p className="text-gray-500 mt-1">
          View all restaurants registered on ApnaMaal.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurant, cuisine or address..."
          className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="ALL">All Restaurants</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">
        Showing {filteredRestaurants.length} of {restaurants.length} restaurants
      </p>
      <DataTable
        columns={['Restaurant', 'Cuisine', 'Address', 'Rating', 'Status', 'Action']}
        rows={filteredRestaurants.map((restaurant) => {
          const address =
            typeof restaurant.address === 'string'
              ? restaurant.address
              : [
                  restaurant.address?.street,
                  restaurant.address?.city,
                  restaurant.address?.state,
                ]
                  .filter(Boolean)
                  .join(', ') || 'N/A'
          return [
            restaurant.name || 'N/A',
            restaurant.cuisine || 'N/A',
            address,
            restaurant.rating ?? 'N/A',
            <StatusBadge
              status={restaurant.isOpen === false ? 'CLOSED' : 'OPEN'}
            />,
            <button
              onClick={() => setSelectedRestaurant(restaurant)}
              className="text-red-500 font-semibold hover:text-red-600"
            >
              View Details
            </button>,
          ]
        })}
      />
      {selectedRestaurant && (
        <DetailsModal
          title="Restaurant Details"
          onClose={() => setSelectedRestaurant(null)}
        >
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="text-gray-500">Restaurant Name</p>
              <p className="font-semibold">
                {selectedRestaurant.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cuisine</p>
              <p className="font-semibold">
                {selectedRestaurant.cuisine || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Description</p>
              <p className="font-semibold">
                {selectedRestaurant.description || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-semibold">
                {typeof selectedRestaurant.address === 'string'
                  ? selectedRestaurant.address
                  : [
                      selectedRestaurant.address?.street,
                      selectedRestaurant.address?.city,
                      selectedRestaurant.address?.state,
                      selectedRestaurant.address?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Rating</p>
              <p className="font-semibold">
                {selectedRestaurant.rating ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Delivery Time</p>
              <p className="font-semibold">
                {selectedRestaurant.deliveryTime
                  ? `${selectedRestaurant.deliveryTime} minutes`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Delivery Fee</p>
              <p className="font-semibold">
                {formatCurrency(selectedRestaurant.deliveryFee)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Restaurant Status</p>
              <StatusBadge
                status={selectedRestaurant.isOpen === false ? 'CLOSED' : 'OPEN'}
              />
            </div>
          </div>
        </DetailsModal>
      )}
    </div>
  )
}

// DELIVERY PARTNER KYC MANAGEMENT
function getDocumentUrl(value) {
  if (!value || typeof value !== 'string') return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${serverOrigin}${value.startsWith('/') ? '' : '/'}${value}`
}

function DocumentLink({ label, value }) {
  if (!value) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Not uploaded</p>
      </div>
    )
  }

  const url = getDocumentUrl(value)
  const isImage = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value) || value.startsWith('data:image/')

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {isImage && (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={label}
            className="w-full h-36 object-contain rounded-lg bg-gray-50 dark:bg-gray-900 mb-2"
          />
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-red-600 hover:text-red-700"
      >
        {isImage ? 'Open image' : 'Open document'}
      </a>
    </div>
  )
}

function DeliveryKYCManagement({ deliveryPartners, onKycChange }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const filteredPartners = deliveryPartners.filter((partner) => {
    const searchText = search.toLowerCase()
    const name = String(partner.name || partner.user?.name || '').toLowerCase()
    const phone = String(partner.phone || partner.user?.phone || '').toLowerCase()
    const email = String(partner.email || partner.user?.email || '').toLowerCase()
    const vehicleNumber = String(partner.vehicle?.number || '').toLowerCase()
    const matchesSearch =
      name.includes(searchText) ||
      phone.includes(searchText) ||
      email.includes(searchText) ||
      vehicleNumber.includes(searchText)

    const status = String(partner.kycStatus || 'PENDING').toUpperCase()
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter
    return matchesSearch && matchesStatus
  })

  const counts = {
    PENDING: deliveryPartners.filter((partner) => (partner.kycStatus || 'PENDING') === 'PENDING').length,
    APPROVED: deliveryPartners.filter((partner) => partner.kycStatus === 'APPROVED').length,
    REJECTED: deliveryPartners.filter((partner) => partner.kycStatus === 'REJECTED').length,
  }

  const handleDecision = async (partner, status) => {
    if (!partner?._id || updatingId) return

    let rejectionReason = ''
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('Enter the reason for rejecting this KYC application:')
      if (rejectionReason === null) return
      if (!rejectionReason.trim()) {
        window.alert('Rejection reason is required.')
        return
      }
    } else if (!window.confirm(`Approve KYC for ${partner.name || 'this delivery partner'}?`)) {
      return
    }

    try {
      setUpdatingId(partner._id)
      const updatedPartner = await onKycChange(partner._id, status, rejectionReason)
      setSelectedPartner({ ...partner, ...updatedPartner })
      window.alert(`KYC ${status.toLowerCase()} successfully.`)
    } catch (error) {
      window.alert(error.message || 'Failed to update KYC status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const address = (partner) => {
    const value = partner.address || {}
    return [value.street, value.city, value.state, value.pincode].filter(Boolean).join(', ') || 'N/A'
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Delivery Partner KYC Verification
        </h2>
        <p className="text-gray-500 mt-1">
          Review delivery partner details and documents before approving access to delivery orders.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending Applications" value={counts.PENDING} icon="⏳" color="text-yellow-500" />
        <StatCard title="Approved Applications" value={counts.APPROVED} icon="✅" color="text-green-500" />
        <StatCard title="Rejected Applications" value={counts.REJECTED} icon="❌" color="text-red-500" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, email or vehicle number..."
          className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="ALL">All Applications</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filteredPartners.length} of {deliveryPartners.length} applications
      </p>

      <DataTable
        columns={['Name', 'Phone', 'Vehicle', 'Vehicle Number', 'KYC Status', 'Action']}
        rows={filteredPartners.map((partner) => [
          partner.name || partner.user?.name || 'N/A',
          partner.phone || partner.user?.phone || 'N/A',
          partner.vehicle?.type || 'N/A',
          partner.vehicle?.number || 'N/A',
          <StatusBadge status={partner.kycStatus || 'PENDING'} />,
          <button
            onClick={() => setSelectedPartner(partner)}
            className="text-red-500 font-semibold hover:text-red-600"
          >
            Review
          </button>,
        ])}
        emptyMessage="No delivery partner KYC applications found."
      />

      {selectedPartner && (
        <DetailsModal
          title="Delivery Partner KYC Details"
          onClose={() => setSelectedPartner(null)}
        >
          <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-gray-500">KYC Status</p>
                <StatusBadge status={selectedPartner.kycStatus || 'PENDING'} />
              </div>
              <div>
                <p className="text-gray-500">Partner Status</p>
                <StatusBadge status={selectedPartner.status || 'OFFLINE'} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-semibold">{selectedPartner.name || selectedPartner.user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold">{selectedPartner.phone || selectedPartner.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold break-all">{selectedPartner.email || selectedPartner.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-semibold">{address(selectedPartner)}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle Type</p>
                <p className="font-semibold">{selectedPartner.vehicle?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle Number</p>
                <p className="font-semibold">{selectedPartner.vehicle?.number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle Model</p>
                <p className="font-semibold">{selectedPartner.vehicle?.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle Color</p>
                <p className="font-semibold">{selectedPartner.vehicle?.color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Driving Licence Number</p>
                <p className="font-semibold">{selectedPartner.license?.number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Licence Expiry</p>
                <p className="font-semibold">{formatDate(selectedPartner.license?.expiryDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Registered On</p>
                <p className="font-semibold">{formatDate(selectedPartner.createdAt)}</p>
              </div>
            </div>

            {selectedPartner.rejectionReason && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
                <p className="font-semibold text-red-700 dark:text-red-300">Rejection Reason</p>
                <p className="mt-1">{selectedPartner.rejectionReason}</p>
              </div>
            )}

            <div>
              <h3 className="font-bold text-base mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DocumentLink label="Driving Licence - Front" value={selectedPartner.license?.frontImage} />
                <DocumentLink label="Driving Licence - Back" value={selectedPartner.license?.backImage} />
                <DocumentLink label="Aadhaar Card Image" value={selectedPartner.aadhar?.image} />
                <DocumentLink label="Vehicle RC" value={selectedPartner.documents?.vehicleRC} />
                <DocumentLink label="Vehicle Insurance" value={selectedPartner.documents?.insurance} />
                <DocumentLink label="Partner Photo" value={selectedPartner.documents?.photo} />
              </div>
            </div>

            {selectedPartner.kycStatus !== 'APPROVED' && (
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => handleDecision(selectedPartner, 'APPROVED')}
                  disabled={updatingId === selectedPartner._id}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                >
                  {updatingId === selectedPartner._id ? 'Updating...' : 'Approve KYC'}
                </button>
                <button
                  onClick={() => handleDecision(selectedPartner, 'REJECTED')}
                  disabled={updatingId === selectedPartner._id}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                >
                  {updatingId === selectedPartner._id ? 'Updating...' : 'Reject KYC'}
                </button>
              </div>
            )}
          </div>
        </DetailsModal>
      )}
    </div>
  )
}


export default AdminDashboard
