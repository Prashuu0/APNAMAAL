

import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { AnimatePresence, motion } from 'framer-motion'



import { useApp } from '../context/AppContext'

import { useToast } from '../components/Toast'

import {

  fetchOwnerRestaurants,

  fetchRestaurantOrders,

  fetchAddresses,

  addAddress,

  updateAddress,

  deleteAddress,

  setDefaultAddress,

} from '../services/api'

import OwnerDashboard from './OwnerDashboard'



const statusStyles = {

  PLACED: 'bg-blue-50 text-blue-700 border-blue-100',

  CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-100',

  PREPARING: 'bg-orange-50 text-orange-700 border-orange-100',

  OUT_FOR_DELIVERY: 'bg-red-50 text-red-700 border-red-100',

  DELIVERED: 'bg-green-50 text-green-700 border-green-100',

  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',

}



const statusIcons = {

  PLACED: '📦',

  CONFIRMED: '✓',

  PREPARING: '👨‍🍳',

  OUT_FOR_DELIVERY: '🚚',

  DELIVERED: '🎉',

  CANCELLED: '✕',

}



function StatusBadge({ status = 'PLACED' }) {

  return (

    <span

      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${

        statusStyles[status] || 'bg-gray-100 text-gray-600 border-gray-200'

      }`}

    >

      <span>{statusIcons[status] || '📋'}</span>

      {status.replace(/_/g, ' ')}

    </span>

  )

}



function StatCard({ icon, label, value, description }) {

  return (

    <motion.div

      whileHover={{ y: -4 }}

      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"

    >

      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">

          {icon}

        </div>

        <span className="text-xs font-semibold text-gray-400">

          ApnaMaal

        </span>

      </div>



      <p className="mt-5 text-2xl font-extrabold text-gray-900">

        {value}

      </p>



      <p className="mt-1 text-sm font-semibold text-gray-700">

        {label}

      </p>



      {description && (

        <p className="mt-1 text-xs text-gray-400">{description}</p>

      )}

    </motion.div>

  )

}



function EmptyState({ icon = '📦', title, description, children }) {

  return (

    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center">

      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">

        {icon}

      </div>



      <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>



      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">

        {description}

      </p>



      {children}

    </div>

  )

}



export default function Profile() {

  const navigate = useNavigate()

  const { push } = useToast()



  const {

    state: { user, orderHistory },

    setUser,

    logout,

    reorder,

  } = useApp()



  const [ownerRestaurants, setOwnerRestaurants] = useState([])

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')

  const [ownerOrders, setOwnerOrders] = useState([])

  const [ownerLoading, setOwnerLoading] = useState(false)

  const [ownerError, setOwnerError] = useState('')

  const [expandedOrderId, setExpandedOrderId] = useState(null)

  // Saved Addresses

const [addresses, setAddresses] = useState([])

const [addressLoading, setAddressLoading] = useState(false)

const [addressSaving, setAddressSaving] = useState(false)

const [showAddressForm, setShowAddressForm] = useState(false)

const [editingAddressId, setEditingAddressId] = useState(null)



const initialAddressForm = {

  type: 'home',

  label: '',

  address: '',

  city: '',

  pincode: '',

  isDefault: false,

}



const [addressForm, setAddressForm] = useState(initialAddressForm)



  const [ownerAggregates, setOwnerAggregates] = useState({

    totalRestaurants: 0,

    totalOrders: 0,

    totalDelivered: 0,

    perRestaurant: [],

  })



  const [ownerAllOrders, setOwnerAllOrders] = useState([])

  const [showManage, setShowManage] = useState(false)

  const [ownerActiveTab, setOwnerActiveTab] = useState('restaurants')



  const manageSectionRef = useRef(null)



  useEffect(() => {

  const userId = user?._id || user?.id



  if (!userId || user.role === 'restaurant_owner') {

    setAddresses([])

    return

  }



  let mounted = true



  const loadAddresses = async () => {

    try {

      setAddressLoading(true)



      const result = await fetchAddresses(userId)



      if (!mounted) return



      setAddresses(

  Array.isArray(result)

    ? result

    : result?.addresses || result?.data?.addresses || []

)

    } catch (error) {

      console.error('Address loading failed:', error)

      if (mounted) {

        push(error.message || 'Unable to load saved addresses', 'error')

      }

    } finally {

      if (mounted) setAddressLoading(false)

    }

  }



  loadAddresses()



  return () => {

    mounted = false

  }

}, [user?._id, user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'restaurant_owner' || !(user?._id || user?.id)) {

      return undefined

    }



    let mounted = true



    const loadOwnerData = async () => {

      try {

        setOwnerLoading(true)

        setOwnerError('')



        const list = await fetchOwnerRestaurants(user._id || user.id)



        if (!mounted) return



        const restaurants = list || []

        setOwnerRestaurants(restaurants)



        const firstId = restaurants[0]

          ? restaurants[0]._id || restaurants[0].id

          : ''



        const allOrdersArrays = await Promise.all(

          restaurants.map(restaurant =>

            fetchRestaurantOrders(restaurant._id || restaurant.id),

          ),

        )



        if (!mounted) return



        const perRestaurant = restaurants.map((restaurant, index) => {

          const orders = allOrdersArrays[index] || []



          return {

            id: restaurant._id || restaurant.id,

            name: restaurant.name,

            orders: orders.length,

            delivered: orders.filter(

              order => order.status === 'DELIVERED',

            ).length,

          }

        })



        setOwnerAggregates({

          totalRestaurants: restaurants.length,

          totalOrders: perRestaurant.reduce(

            (sum, restaurant) => sum + restaurant.orders,

            0,

          ),

          totalDelivered: perRestaurant.reduce(

            (sum, restaurant) => sum + restaurant.delivered,

            0,

          ),

          perRestaurant,

        })



        setOwnerAllOrders(allOrdersArrays.flat())



        if (firstId) {

          setSelectedRestaurantId(firstId)

          setOwnerOrders(allOrdersArrays[0] || [])

        } else {

          setSelectedRestaurantId('')

          setOwnerOrders([])

        }

      } catch (error) {

        if (!mounted) return



        console.error('Profile: Owner data loading failed:', error)

        setOwnerError(error.message || 'Unable to load restaurant information')

      } finally {

        if (mounted) setOwnerLoading(false)

      }

    }



    loadOwnerData()



    return () => {

      mounted = false

    }

  }, [user?._id, user?.id, user?.role])



  const handleReorder = order => {

    reorder(order)

    push('Items added to cart!', 'success')

    navigate('/cart')

  }



  const handleLogout = () => {

    logout()

    push('Logged out successfully!', 'success')

    navigate('/login')

  }



  const handleRestaurantChange = async event => {

    const restaurantId = event.target.value



    setSelectedRestaurantId(restaurantId)

    setOwnerOrders([])

    setOwnerError('')



    if (!restaurantId) return



    try {

      setOwnerLoading(true)



      const orders = await fetchRestaurantOrders(restaurantId)

      setOwnerOrders(orders || [])

    } catch (error) {

      setOwnerError(error.message || 'Unable to load restaurant orders')

      setOwnerOrders([])

    } finally {

      setOwnerLoading(false)

    }

  }







const handleAddressFormChange = event => {

  const { name, value, type, checked } = event.target



  setAddressForm(prev => ({

    ...prev,

    [name]: type === 'checkbox' ? checked : value,

  }))

}



const resetAddressForm = () => {

  setAddressForm(initialAddressForm)

  setEditingAddressId(null)

  setShowAddressForm(false)

}



const refreshAddresses = async () => {

  const userId = user?._id || user?.id

  const result = await fetchAddresses(userId)



  setAddresses(

    Array.isArray(result)

      ? result

      : result.addresses || result.data?.addresses || []

  )

}



const handleSaveAddress = async event => {

  event.preventDefault()



  const userId = user?._id || user?.id



  if (!addressForm.address.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()) {

    push('Please fill all required address fields', 'error')

    return

  }



  try {

    setAddressSaving(true)



    const payload = {

      ...addressForm,

      label: addressForm.label.trim() || addressForm.type,

      address: addressForm.address.trim(),

      city: addressForm.city.trim(),

      pincode: addressForm.pincode.trim(),

    }



    if (editingAddressId) {

      await updateAddress(userId, editingAddressId, payload)

      push('Address updated successfully!', 'success')

    } else {

      await addAddress(userId, payload)

      push('Address added successfully!', 'success')

    }



    await refreshAddresses()

    resetAddressForm()

  } catch (error) {

    console.error('Address save failed:', error)

    push(error.message || 'Unable to save address', 'error')

  } finally {

    setAddressSaving(false)

  }

}



const handleEditAddress = address => {

  setEditingAddressId(address._id)



  setAddressForm({

    type: address.type || 'other',

    label: address.label || '',

    address: address.address || '',

    city: address.city || '',

    pincode: address.pincode || '',

    isDefault: Boolean(address.isDefault),

  })



  setShowAddressForm(true)

}



const handleDeleteAddress = async addressId => {

  if (!window.confirm('Are you sure you want to delete this address?')) {

    return

  }



  try {

    await deleteAddress(user._id || user.id, addressId)

    await refreshAddresses()

    push('Address deleted successfully!', 'success')

  } catch (error) {

    console.error('Address delete failed:', error)

    push(error.message || 'Unable to delete address', 'error')

  }

}



const handleSetDefaultAddress = async addressId => {

  try {

    await setDefaultAddress(user._id || user.id, addressId)

    await refreshAddresses()

    push('Default address updated!', 'success')

  } catch (error) {

    console.error('Default address update failed:', error)

    push(error.message || 'Unable to update default address', 'error')

  }

}





  const totalOrders = orderHistory.length



  const totalSpent = orderHistory.reduce((sum, order) => {

    if (order.items && order.items.length > 0) {

      return (

        sum +

        order.items.reduce((itemSum, { item, quantity }) => {

          return itemSum + (item?.price || 0) * (quantity || 0)

        }, 0)

      )

    }



    return sum

  }, 0)



  const avgOrderValue =

    totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0



  const deliveredOrders = orderHistory.filter(

    order => order.status === 'DELIVERED',

  ).length



  const ownerTabs = [

    { key: 'restaurants', label: 'Restaurants', icon: '🏪' },

    { key: 'orders', label: 'Customer Orders', icon: '📦' },

    { key: 'delivery', label: 'Delivery Reports', icon: '🚚' },

  ]



  const ownerCustomers = Object.values(

    ownerAllOrders.reduce((acc, order) => {

      const key = order.userId?._id || order.userId || 'unknown'



      if (!acc[key]) {

        acc[key] = {

          name: order.userId?.name || 'User',

          phone: order.userId?.phone || 'N/A',

          count: 0,

        }

      }



      acc[key].count += 1

      return acc

    }, {}),

  )



  return (

    <div className="min-h-screen bg-[#fffdfb] pb-16">

      {/* Profile Hero */}

      <section className="border-b border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          {user ? (

            <motion.div

              initial={{ opacity: 0, y: 15 }}

              animate={{ opacity: 1, y: 0 }}

              className="flex flex-col justify-between gap-7 md:flex-row md:items-center"

            >

              <div className="flex items-center gap-5">

                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-red-600 text-4xl font-extrabold text-white shadow-lg shadow-red-100 sm:h-24 sm:w-24 sm:text-5xl">

                  {user.name?.charAt(0)?.toUpperCase() || 'U'}

                </div>



                <div className="min-w-0">

                  <p className="text-sm font-bold uppercase tracking-wider text-red-600">

                    Welcome to ApnaMaal

                  </p>



                  <h1 className="mt-1 truncate text-3xl font-extrabold text-gray-900 sm:text-4xl">

                    {user.name || 'User'}

                  </h1>



                  <p className="mt-2 text-sm text-gray-500">

                    {user.role === 'restaurant_owner'

                      ? 'Restaurant Owner Account'

                      : 'Your personal account'}

                  </p>



                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">

                    {user.email && (

                      <span className="flex items-center gap-2">

                        ✉️ {user.email}

                      </span>

                    )}



                    {user.phone && (

                      <span className="flex items-center gap-2">

                        📞 {user.phone}

                      </span>

                    )}

                  </div>

                </div>

              </div>



              <div className="flex flex-wrap gap-3">

                {user.role === 'restaurant_owner' && (

                  <button

                    type="button"

                    onClick={() => {

                      const next = !showManage

                      setShowManage(next)



                      if (next) {

                        setTimeout(() => {

                          manageSectionRef.current?.scrollIntoView({

                            behavior: 'smooth',

                            block: 'start',

                          })

                        }, 100)

                      }

                    }}

                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:bg-red-700"

                  >

                    {showManage ? 'Close Management' : '⚙️ Manage Restaurant'}

                  </button>

                )}



                <button

                  type="button"

                  onClick={handleLogout}

                  className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"

                >

                  ↪ Logout

                </button>

              </div>

            </motion.div>

          ) : (

            <div className="py-8 text-center">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-4xl">

                👤

              </div>



              <h1 className="text-3xl font-extrabold text-gray-900">

                Welcome to ApnaMaal!

              </h1>



              <p className="mt-2 text-gray-500">

                Sign in to save your preferences and view your order history.

              </p>



              <button

                type="button"

                onClick={() => setUser({ name: 'Guest User' })}

                className="mt-6 rounded-xl bg-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-700"

              >

                Continue as Guest

              </button>

            </div>

          )}

        </div>

      </section>



      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">

        {/* Customer Statistics */}

        {user && user.role !== 'restaurant_owner' && (

          <motion.section

            initial={{ opacity: 0, y: 15 }}

            animate={{ opacity: 1, y: 0 }}

            className="mb-10"

          >

            <div className="mb-5">

              <h2 className="text-2xl font-extrabold text-gray-900">

                Your Activity

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                A quick look at your ApnaMaal journey.

              </p>

            </div>



            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard

                icon="📦"

                label="Total Orders"

                value={totalOrders}

                description="Orders placed"

              />



              <StatCard

                icon="💰"

                label="Total Spent"

                value={`₹${totalSpent.toLocaleString('en-IN')}`}

                description="Calculated from available item prices"

              />



              <StatCard

                icon="📊"

                label="Average Order Value"

                value={`₹${avgOrderValue.toLocaleString('en-IN')}`}

                description="Average per order"

              />



              <StatCard

                icon="🎉"

                label="Delivered Orders"

                value={deliveredOrders}

                description="Successfully delivered"

              />

            </div>

          </motion.section>

        )}



        {/* Owner Statistics */}

        {user?.role === 'restaurant_owner' && (

          <motion.section

            initial={{ opacity: 0, y: 15 }}

            animate={{ opacity: 1, y: 0 }}

            className="mb-10"

          >

            <div className="mb-5">

              <h2 className="text-2xl font-extrabold text-gray-900">

                Business Overview

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                Your restaurant performance at a glance.

              </p>

            </div>



            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <button

                type="button"

                onClick={() => setOwnerActiveTab('restaurants')}

                className="text-left"

              >

                <StatCard

                  icon="🏪"

                  label="Restaurants"

                  value={ownerAggregates.totalRestaurants}

                  description="Your registered restaurants"

                />

              </button>



              <button

                type="button"

                onClick={() => setOwnerActiveTab('orders')}

                className="text-left"

              >

                <StatCard

                  icon="📦"

                  label="Total Orders"

                  value={ownerAggregates.totalOrders}

                  description="Orders received"

                />

              </button>



              <button

                type="button"

                onClick={() => setOwnerActiveTab('delivery')}

                className="text-left"

              >

                <StatCard

                  icon="🎉"

                  label="Delivered"

                  value={ownerAggregates.totalDelivered}

                  description="Successfully delivered"

                />

              </button>

            </div>

          </motion.section>

        )}



        {/* Restaurant Owner Section */}

        {user?.role === 'restaurant_owner' && (

          <section

            ref={manageSectionRef}

            className="mb-10 scroll-mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"

          >

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm font-bold uppercase tracking-wider text-red-600">

                  Owner Workspace

                </p>



                <h2 className="mt-1 text-2xl font-extrabold text-gray-900">

                  Restaurant Management

                </h2>



                <p className="mt-1 text-sm text-gray-500">

                  Manage your restaurant, menu, offers and incoming orders.

                </p>

              </div>



              <button

                type="button"

                onClick={() => setShowManage(prev => !prev)}

                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"

              >

                {showManage ? 'Hide Dashboard' : 'Open Owner Dashboard'}

              </button>

            </div>



            <AnimatePresence>

              {showManage && (

                <motion.div

                  initial={{ opacity: 0, height: 0, y: 10 }}

                  animate={{ opacity: 1, height: 'auto', y: 0 }}

                  exit={{ opacity: 0, height: 0, y: -10 }}

                  transition={{ duration: 0.25 }}

                  className="overflow-hidden"

                >

                  <div className="mt-7 border-t border-gray-100 pt-7">

                    <OwnerDashboard />

                  </div>

                </motion.div>

              )}

            </AnimatePresence>



            {/* Owner Tabs */}

            <div className="mt-8 flex gap-2 overflow-x-auto border-b border-gray-100 pb-3">

              {ownerTabs.map(tab => (

                <button

                  key={tab.key}

                  type="button"

                  onClick={() => setOwnerActiveTab(tab.key)}

                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${

                    ownerActiveTab === tab.key

                      ? 'bg-red-600 text-white shadow-md shadow-red-100'

                      : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'

                  }`}

                >

                  {tab.icon} {tab.label}

                </button>

              ))}

            </div>



            {ownerError && (

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

                {ownerError}

              </div>

            )}



            {/* Restaurants Tab */}

            {ownerActiveTab === 'restaurants' && (

              <div className="mt-6">

                <h3 className="mb-4 text-lg font-extrabold text-gray-900">

                  Your Restaurants

                </h3>



                {ownerAggregates.perRestaurant.length > 0 ? (

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {ownerAggregates.perRestaurant.map(restaurant => (

                      <div

                        key={restaurant.id}

                        className="rounded-2xl border border-gray-100 bg-[#fffdfb] p-5"

                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">

                            🏪

                          </div>



                          <div className="min-w-0">

                            <h4 className="truncate font-extrabold text-gray-900">

                              {restaurant.name}

                            </h4>

                            <p className="text-xs text-gray-500">

                              Restaurant performance

                            </p>

                          </div>

                        </div>



                        <div className="mt-5 grid grid-cols-2 gap-3">

                          <div className="rounded-xl bg-white p-3">

                            <p className="text-xl font-extrabold text-gray-900">

                              {restaurant.orders}

                            </p>

                            <p className="text-xs text-gray-500">Orders</p>

                          </div>



                          <div className="rounded-xl bg-white p-3">

                            <p className="text-xl font-extrabold text-green-600">

                              {restaurant.delivered}

                            </p>

                            <p className="text-xs text-gray-500">Delivered</p>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                ) : ownerLoading ? (

                  <p className="py-8 text-center text-sm text-gray-500">

                    Loading restaurants...

                  </p>

                ) : (

                  <EmptyState

                    icon="🏪"

                    title="No restaurants found"

                    description="Open the Owner Dashboard to create and manage your restaurant."

                  >

                    <button

                      type="button"

                      onClick={() => setShowManage(true)}

                      className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"

                    >

                      Open Owner Dashboard

                    </button>

                  </EmptyState>

                )}

              </div>

            )}



            {/* Customer Orders Tab */}

            {ownerActiveTab === 'orders' && (

              <div className="mt-6 space-y-6">

                <h3 className="text-lg font-extrabold text-gray-900">

                  Customer Overview

                </h3>



                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                  {[

                    {

                      label: 'Pending / Preparing',

                      value: ownerAllOrders.filter(order =>

                        ['PLACED', 'CONFIRMED', 'PREPARING'].includes(

                          order.status,

                        ),

                      ).length,

                    },

                    {

                      label: 'Out for Delivery',

                      value: ownerAllOrders.filter(

                        order => order.status === 'OUT_FOR_DELIVERY',

                      ).length,

                    },

                    {

                      label: 'Delivered',

                      value: ownerAllOrders.filter(

                        order => order.status === 'DELIVERED',

                      ).length,

                    },

                  ].map(item => (

                    <div

                      key={item.label}

                      className="rounded-2xl border border-gray-100 bg-[#fffdfb] p-5"

                    >

                      <p className="text-2xl font-extrabold text-gray-900">

                        {item.value}

                      </p>

                      <p className="mt-1 text-sm text-gray-500">

                        {item.label}

                      </p>

                    </div>

                  ))}

                </div>



                <div>

                  <h4 className="mb-3 font-bold text-gray-900">

                    Customers

                  </h4>



                  {ownerCustomers.length ? (

                    <div className="overflow-x-auto rounded-2xl border border-gray-100">

                      <table className="w-full min-w-[500px] text-left text-sm">

                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                          <tr>

                            <th className="px-5 py-4">Customer</th>

                            <th className="px-5 py-4">Phone</th>

                            <th className="px-5 py-4">Orders</th>

                          </tr>

                        </thead>



                        <tbody>

                          {ownerCustomers.map((customer, index) => (

                            <tr

                              key={`${customer.name}-${index}`}

                              className="border-t border-gray-100"

                            >

                              <td className="px-5 py-4 font-semibold text-gray-800">

                                {customer.name}

                              </td>

                              <td className="px-5 py-4 text-gray-600">

                                {customer.phone}

                              </td>

                              <td className="px-5 py-4 font-bold text-red-600">

                                {customer.count}

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">

                      No customer orders available.

                    </p>

                  )}

                </div>

              </div>

            )}



            {/* Delivery Reports Tab */}

            {ownerActiveTab === 'delivery' && (

              <div className="mt-6">

                <h3 className="mb-4 text-lg font-extrabold text-gray-900">

                  Delivery Reports

                </h3>



                {ownerAllOrders.filter(order =>

                  ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),

                ).length ? (

                  <div className="overflow-x-auto rounded-2xl border border-gray-100">

                    <table className="w-full min-w-[750px] text-left text-sm">

                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                        <tr>

                          <th className="px-4 py-4">Order</th>

                          <th className="px-4 py-4">Status</th>

                          <th className="px-4 py-4">Delivery Partner</th>

                          <th className="px-4 py-4">Phone</th>

                          <th className="px-4 py-4">Address</th>

                          <th className="px-4 py-4">Feedback</th>

                        </tr>

                      </thead>



                      <tbody>

                        {ownerAllOrders

                          .filter(order =>

                            ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(

                              order.status,

                            ),

                          )

                          .map((order, index) => (

                            <tr

                              key={order.orderId || index}

                              className="border-t border-gray-100"

                            >

                              <td className="px-4 py-4 font-bold text-gray-800">

                                #{String(order.orderId || '').slice(-6).toUpperCase()}

                              </td>



                              <td className="px-4 py-4">

                                <StatusBadge status={order.status} />

                              </td>



                              <td className="px-4 py-4 text-gray-700">

                                {order.deliveryBoyId?.name || 'N/A'}

                              </td>



                              <td className="px-4 py-4 text-gray-600">

                                {order.deliveryBoyId?.phone || 'N/A'}

                              </td>



                              <td className="max-w-xs px-4 py-4 text-gray-600">

                                {order.address || 'N/A'}

                              </td>



                              <td className="px-4 py-4 text-gray-600">

                                {order.feedback || 'Not available'}

                              </td>

                            </tr>

                          ))}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <EmptyState

                    icon="🚚"

                    title="No delivery records yet"

                    description="Delivery reports will appear here when orders are assigned and dispatched."

                  />

                )}

              </div>

            )}



            {/* Orders Received */}

            <div className="mt-10 border-t border-gray-100 pt-7">

              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                <div>

                  <h3 className="text-xl font-extrabold text-gray-900">

                    Orders Received

                  </h3>

                  <p className="mt-1 text-sm text-gray-500">

                    View order details for each restaurant.

                  </p>

                </div>



                <select

                  value={selectedRestaurantId}

                  onChange={handleRestaurantChange}

                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"

                >

                  <option value="">Select Restaurant</option>



                  {ownerRestaurants.map(restaurant => (

                    <option

                      key={restaurant._id || restaurant.id}

                      value={restaurant._id || restaurant.id}

                    >

                      {restaurant.name}

                    </option>

                  ))}

                </select>

              </div>



              {ownerLoading ? (

                <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">

                  Loading orders...

                </p>

              ) : ownerOrders.length ? (

                <div className="space-y-4">

                  {ownerOrders.map((order, index) => {

                    const orderKey = order.orderId || index

                    const isExpanded = expandedOrderId === orderKey



                    return (

                      <div

                        key={orderKey}

                        className="overflow-hidden rounded-2xl border border-gray-100 bg-[#fffdfb]"

                      >

                        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-3">

                              <h4 className="font-extrabold text-gray-900">

                                #{String(order.orderId || '').slice(-6).toUpperCase()}

                              </h4>

                              <StatusBadge status={order.status || 'PLACED'} />

                            </div>



                            <p className="mt-2 text-sm text-gray-700">

                              {order.userId?.name || 'User'} ·{' '}

                              {order.userId?.phone || 'N/A'}

                            </p>



                            <p className="mt-1 text-xs text-gray-400">

                              {order.createdAt

                                ? new Date(order.createdAt).toLocaleString('en-IN')

                                : 'Date unavailable'}

                            </p>

                          </div>



                          <div className="flex flex-wrap items-center gap-3">

                            <span className="text-xs text-gray-500">

                              {order.items?.reduce(

                                (sum, item) => sum + (item.quantity || 0),

                                0,

                              )} item(s)

                            </span>



                            <button

                              type="button"

                              onClick={() =>

                                setExpandedOrderId(

                                  isExpanded ? null : orderKey,

                                )

                              }

                              className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"

                            >

                              {isExpanded ? 'Hide Details' : 'View Details'}

                            </button>

                          </div>

                        </div>



                        <AnimatePresence>

                          {isExpanded && (

                            <motion.div

                              initial={{ opacity: 0, height: 0 }}

                              animate={{ opacity: 1, height: 'auto' }}

                              exit={{ opacity: 0, height: 0 }}

                              className="overflow-hidden"

                            >

                              <div className="grid grid-cols-1 gap-6 border-t border-gray-100 bg-white p-5 md:grid-cols-2">

                                <div>

                                  <h5 className="mb-3 font-extrabold text-gray-900">

                                    Order Items

                                  </h5>



                                  <div className="space-y-3">

                                    {(order.items || []).map((item, itemIndex) => (

                                      <div

                                        key={item._id || itemIndex}

                                        className="flex justify-between gap-3 text-sm"

                                      >

                                        <span className="text-gray-700">

                                          {item.name || item.item?.name || 'Item'}

                                          <span className="ml-2 text-gray-400">

                                            × {item.quantity || 1}

                                          </span>

                                        </span>



                                        <span className="font-semibold text-gray-900">

                                          ₹{item.price || item.item?.price || 0}

                                        </span>

                                      </div>

                                    ))}

                                  </div>



                                  <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">

                                    <div className="flex justify-between text-gray-500">

                                      <span>Subtotal</span>

                                      <span>₹{order.pricing?.subtotal ?? 0}</span>

                                    </div>



                                    <div className="flex justify-between text-gray-500">

                                      <span>Delivery</span>

                                      <span>₹{order.pricing?.deliveryFee ?? 0}</span>

                                    </div>



                                    <div className="flex justify-between text-gray-500">

                                      <span>Tax</span>

                                      <span>₹{order.pricing?.tax ?? 0}</span>

                                    </div>



                                    {order.pricing?.discount ? (

                                      <div className="flex justify-between text-green-600">

                                        <span>Discount</span>

                                        <span>-₹{order.pricing.discount}</span>

                                      </div>

                                    ) : null}



                                    <div className="flex justify-between border-t border-gray-100 pt-3 font-extrabold text-gray-900">

                                      <span>Total</span>

                                      <span className="text-red-600">

                                        ₹{order.pricing?.total ?? 0}

                                      </span>

                                    </div>

                                  </div>

                                </div>



                                <div>

                                  <h5 className="mb-3 font-extrabold text-gray-900">

                                    Customer & Delivery

                                  </h5>



                                  <div className="space-y-3 text-sm">

                                    <div>

                                      <p className="text-xs text-gray-400">Customer</p>

                                      <p className="font-semibold text-gray-800">

                                        {order.userId?.name || 'User'}

                                      </p>

                                    </div>



                                    <div>

                                      <p className="text-xs text-gray-400">Phone</p>

                                      <p className="font-semibold text-gray-800">

                                        {order.userId?.phone || 'N/A'}

                                      </p>

                                    </div>



                                    <div>

                                      <p className="text-xs text-gray-400">Address</p>

                                      <p className="font-semibold text-gray-800">

                                        {order.address || 'N/A'}

                                      </p>

                                    </div>



                                    <div>

                                      <p className="text-xs text-gray-400">Payment</p>

                                      <p className="font-semibold text-gray-800">

                                        {order.paymentMethod || 'N/A'}

                                      </p>

                                    </div>



                                    <div>

                                      <p className="text-xs text-gray-400">

                                        Delivery Partner

                                      </p>

                                      <p className="font-semibold text-gray-800">

                                        {order.deliveryBoyId

                                          ? `${order.deliveryBoyId.name} (${order.deliveryBoyId.phone || 'N/A'})`

                                          : 'Not assigned'}

                                      </p>

                                    </div>

                                  </div>

                                </div>

                              </div>

                            </motion.div>

                          )}

                        </AnimatePresence>

                      </div>

                    )

                  })}

                </div>

              ) : (

                <EmptyState

                  icon="📦"

                  title="No orders yet"

                  description={

                    selectedRestaurantId

                      ? 'This restaurant has not received any orders yet.'

                      : 'Select a restaurant to view its orders.'

                  }

                />

              )}

            </div>

          </section>

        )}



        {/* Customer Order History */}



{/* Saved Addresses */}

{user && user.role !== 'restaurant_owner' && (

  <section className="mb-10">

    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

      <div>

        <p className="text-sm font-bold uppercase tracking-wider text-red-600">

          Delivery Details

        </p>

        <h2 className="mt-1 text-2xl font-extrabold text-gray-900">

          Saved Addresses

        </h2>

        <p className="mt-1 text-sm text-gray-500">

          Manage your home, work and other delivery addresses.

        </p>

      </div>



      <button

        type="button"

        onClick={() => {

          setAddressForm(initialAddressForm)

          setEditingAddressId(null)

          setShowAddressForm(prev => !prev)

        }}

        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"

      >

        {showAddressForm ? 'Close Form' : '+ Add New Address'}

      </button>

    </div>



    {showAddressForm && (

      <form

        onSubmit={handleSaveAddress}

        className="mb-6 rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:p-6"

      >

        <h3 className="mb-5 text-lg font-extrabold text-gray-900">

          {editingAddressId ? 'Edit Address' : 'Add New Address'}

        </h3>



        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Address Type

            </label>

            <select

              name="type"

              value={addressForm.type}

              onChange={handleAddressFormChange}

              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"

            >

              <option value="home">Home</option>

              <option value="work">Work</option>

              <option value="other">Other</option>

            </select>

          </div>



          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Label

            </label>

            <input

              name="label"

              value={addressForm.label}

              onChange={handleAddressFormChange}

              placeholder="e.g. My Home"

              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"

            />

          </div>



          <div className="sm:col-span-2">

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Full Address *

            </label>

            <textarea

              name="address"

              value={addressForm.address}

              onChange={handleAddressFormChange}

              required

              rows={3}

              placeholder="House no., street, area, landmark..."

              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"

            />

          </div>



          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              City *

            </label>

            <input

              name="city"

              value={addressForm.city}

              onChange={handleAddressFormChange}

              required

              placeholder="Enter city"

              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"

            />

          </div>



          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">

              Pincode *

            </label>

            <input

              name="pincode"

              value={addressForm.pincode}

              onChange={handleAddressFormChange}

              required

              maxLength={6}

              placeholder="6-digit pincode"

              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"

            />

          </div>

        </div>



        <label className="mt-5 flex items-center gap-2 text-sm font-medium text-gray-700">

          <input

            type="checkbox"

            name="isDefault"

            checked={addressForm.isDefault}

            onChange={handleAddressFormChange}

            className="h-4 w-4 accent-red-600"

          />

          Set as default address

        </label>



        <div className="mt-6 flex flex-wrap gap-3">

          <button

            type="submit"

            disabled={addressSaving}

            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"

          >

            {addressSaving

              ? 'Saving...'

              : editingAddressId

                ? 'Update Address'

                : 'Save Address'}

          </button>



          <button

            type="button"

            onClick={resetAddressForm}

            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"

          >

            Cancel

          </button>

        </div>

      </form>

    )}



    {addressLoading ? (

      <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">

        Loading saved addresses...

      </p>

    ) : addresses.length > 0 ? (

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {addresses.map(address => (

          <div

            key={address._id}

            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"

          >

            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="font-extrabold capitalize text-gray-900">

                  {address.label || address.type || 'Address'}

                </h3>

                <p className="mt-1 text-xs font-semibold uppercase text-gray-400">

                  {address.type || 'Other'}

                </p>

              </div>



              {address.isDefault && (

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">

                  Default

                </span>

              )}

            </div>



            <p className="mt-4 text-sm leading-6 text-gray-600">

              {address.address}

              <br />

              {address.city} - {address.pincode}

            </p>



            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">

              <button

                type="button"

                onClick={() => handleEditAddress(address)}

                className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"

              >

                Edit

              </button>



              {!address.isDefault && (

                <button

                  type="button"

                  onClick={() => handleSetDefaultAddress(address._id)}

                  className="rounded-lg border border-green-100 px-3 py-2 text-xs font-bold text-green-600 hover:bg-green-50"

                >

                  Set as Default

                </button>

              )}



              <button

                type="button"

                onClick={() => handleDeleteAddress(address._id)}

                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"

              >

                Delete

              </button>

            </div>

          </div>

        ))}

      </div>

    ) : (

      <EmptyState

        icon="📍"

        title="No saved addresses"

        description="Add your home or work address to make checkout faster."

      />

    )}

  </section>

)}



        {user?.role !== 'restaurant_owner' && (

          <section>

            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

              <div>

                <p className="text-sm font-bold uppercase tracking-wider text-red-600">

                  Your Activity

                </p>



                <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">

                  Order History

                </h2>



                <p className="mt-1 text-sm text-gray-500">

                  View previous orders, track deliveries and order again.

                </p>

              </div>



              <span className="w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">

                {orderHistory.length} Orders

              </span>

            </div>



            {orderHistory.length > 0 ? (

              <div className="space-y-5">

                {orderHistory.map((order, index) => (

                  <motion.article

                    key={order.orderId || `order-${index}`}

                    initial={{ opacity: 0, y: 12 }}

                    animate={{ opacity: 1, y: 0 }}

                    transition={{ delay: index * 0.04 }}

                    className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"

                  >

                    <div className="flex flex-col justify-between gap-5 lg:flex-row">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl">

                            {statusIcons[order.status] || '📦'}

                          </div>



                          <div>

                            <h3 className="font-extrabold text-gray-900">

                              Order #{order.orderId?.slice(-6).toUpperCase() || 'N/A'}

                            </h3>



                            <p className="mt-1 text-xs text-gray-400">

                              {order.createdAt

                                ? new Date(order.createdAt).toLocaleDateString(

                                    'en-IN',

                                    {

                                      weekday: 'short',

                                      year: 'numeric',

                                      month: 'short',

                                      day: 'numeric',

                                    },

                                  )

                                : 'Recently placed'}

                            </p>

                          </div>



                          <StatusBadge status={order.status || 'PLACED'} />



                          {order.scheduled && (

                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">

                              📅 Scheduled

                            </span>

                          )}

                        </div>



                        {order.address && (

                          <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4">

                            <span className="text-lg">📍</span>

                            <p className="text-sm text-gray-600">

                              {order.address}

                            </p>

                          </div>

                        )}



                        {order.items?.length > 0 && (

                          <div className="mt-5">

                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">

                              Ordered Items

                            </p>



                            <div className="flex flex-wrap gap-2">

                              {order.items.slice(0, 4).map((entry, itemIndex) => {

                                const item = entry.item || entry



                                return (

                                  <span

                                    key={item?.id || item?._id || itemIndex}

                                    className="rounded-xl bg-[#fff3ef] px-3 py-2 text-sm font-semibold text-gray-700"

                                  >

                                    <span className="mr-1 font-extrabold text-red-600">

                                      {entry.quantity || 1}×

                                    </span>

                                    {item?.name || 'Food Item'}

                                    {item?.price ? ` · ₹${item.price}` : ''}

                                  </span>

                                )

                              })}



                              {order.items.length > 4 && (

                                <span className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">

                                  +{order.items.length - 4} more

                                </span>

                              )}

                            </div>

                          </div>

                        )}



                        {order.pricing?.total !== undefined && (

                          <p className="mt-5 text-sm font-bold text-gray-700">

                            Order Total:{' '}

                            <span className="text-lg text-red-600">

                              ₹{order.pricing.total}

                            </span>

                          </p>

                        )}

                      </div>



                      <div className="flex shrink-0 flex-row gap-3 lg:w-40 lg:flex-col">

                        <Link

                          to="/track"

                          className="flex flex-1 items-center justify-center rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"

                        >

                          Track Order

                        </Link>



                        <button

                          type="button"

                          onClick={() => handleReorder(order)}

                          className="flex flex-1 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"

                        >

                          ↻ Reorder

                        </button>

                      </div>

                    </div>

                  </motion.article>

                ))}

              </div>

            ) : (

              <EmptyState

                icon="🛍️"

                title="No order history yet"

                description="Start exploring restaurants and order your favourite food. Your orders will appear here."

              >

                <Link

                  to="/restaurants"

                  className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"

                >

                  Explore Restaurants

                </Link>

              </EmptyState>

            )}

          </section>

        )}

      </main>

    </div>

  )

}
