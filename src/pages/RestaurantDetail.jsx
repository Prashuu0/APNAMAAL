
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMenuByRestaurantId, fetchRestaurantById } from '../services/api'
import { useApp } from '../context/AppContext'
import MenuItemCard from '../components/MenuItemCard'
import { useToast } from '../components/Toast'
import { SkeletonMenuItem } from '../components/Loader'
import { motion } from 'framer-motion'
import Reviews from '../components/Reviews'

export default function RestaurantDetail() {
  const { id } = useParams()
  const { addToCart, removeFromCart, state } = useApp()
  const { push } = useToast()

  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vegFilter, setVegFilter] = useState('all')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        if (!id) {
          setError('Invalid restaurant ID')
          setLoading(false)
          return
        }

        const [r, m] = await Promise.all([
          fetchRestaurantById(id),
          fetchMenuByRestaurantId(id),
        ])

        if (!mounted) return

        if (!r) {
          setError('Restaurant not found')
          return
        }

        const normalizedRestaurant = {
          ...r,
          id: r._id || r.id,
        }

        setRestaurant(normalizedRestaurant)

        const normalizedMenu = (m || []).map((item) => ({
          ...item,
          id: item._id || item.id,
          restaurantId: normalizedRestaurant.id,
          restaurant: {
            id: normalizedRestaurant.id,
            name: normalizedRestaurant.name,
          },
        }))

        setMenu(normalizedMenu)
      } catch (err) {
        if (!mounted) return

        console.error('Error loading restaurant:', err)
        const message = err.message || 'Failed to load restaurant details.'
        setError(message)
        push(message, 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [id, push])

  const menuByCategory = useMemo(() => {
    const grouped = {}

    let filteredMenu = menu

    if (vegFilter === 'veg') {
      filteredMenu = menu.filter((item) => item.veg === true)
    } else if (vegFilter === 'non-veg') {
      filteredMenu = menu.filter((item) => item.veg === false)
    }

    filteredMenu.forEach((item) => {
      const category = item.category || 'Other'

      if (!grouped[category]) grouped[category] = []

      grouped[category].push(item)
    })

    return grouped
  }, [menu, vegFilter])

  const totalMenuItems = menu.length
  const visibleMenuItems = Object.values(menuByCategory).reduce(
    (total, items) => total + items.length,
    0
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdfb]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="h-64 animate-pulse rounded-3xl bg-gray-200" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonMenuItem key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffdfb] px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
            😕
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-gray-900">
            Unable to load restaurant
          </h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#fffdfb] px-5 py-20 text-center">
        <div className="text-5xl">🍽️</div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Restaurant not found
        </h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffdfb]">

      {/* RESTAURANT HERO */}
      <section className="bg-[#fff3ef]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl shadow-red-900/5"
          >
            <div className="relative h-64 sm:h-80">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {restaurant.offer && (
                <div className="absolute left-5 top-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg">
                  🎉 {restaurant.offer}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                  ApnaMaal Restaurant
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  {restaurant.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  {restaurant.description || restaurant.cuisine}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-4 sm:divide-y-0">
              <div className="p-4 sm:p-5">
                <p className="text-xs text-gray-500">Customer Rating</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                  <span className="text-yellow-500">★</span>
                  {restaurant.rating || 'New'}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-xs text-gray-500">Delivery Time</p>
                <p className="mt-2 text-lg font-extrabold text-gray-900">
                  🕒 {restaurant.deliveryTime || '—'} mins
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-xs text-gray-500">Cost for Two</p>
                <p className="mt-2 text-lg font-extrabold text-gray-900">
                  ₹{restaurant.costForTwo || '—'}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-xs text-gray-500">Cuisine</p>
                <p className="mt-2 text-lg font-extrabold text-red-600">
                  {restaurant.cuisine || 'Multi-cuisine'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MENU CONTENT */}
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Explore the menu
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-950 sm:text-3xl">
              Delicious food awaits
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {visibleMenuItems} of {totalMenuItems} menu items
            </p>
          </div>

          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
            ❤️ Made fresh for you
          </div>
        </div>

        {/* DIETARY FILTER */}
        <section className="mt-7 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-gray-900">Choose your preference</h3>
              <p className="mt-1 text-xs text-gray-500">
                Filter dishes according to your choice
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Items' },
                { value: 'veg', label: '🌿 Pure Veg' },
                { value: 'non-veg', label: '🍗 Non-Veg' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setVegFilter(filter.value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    vegFilter === filter.value
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING */}
        <section className="mt-6 rounded-2xl border border-green-100 bg-green-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-xl text-white">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-gray-900">
                Transparent Pricing
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                No hidden charges. Check the applicable charges before checkout.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-gray-500">Delivery Fee</p>
                  <p className="mt-1 font-extrabold text-gray-900">₹30</p>
                </div>

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="mt-1 font-extrabold text-gray-900">5% on order value</p>
                </div>

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-gray-500">Free Delivery</p>
                  <p className="mt-1 font-extrabold text-green-600">Above ₹500</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MENU CATEGORIES */}
        <section className="mt-12 space-y-10">
          {Object.entries(menuByCategory).map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
            >
              <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-950 sm:text-2xl">
                    {category}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {items.length} delicious {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  {items.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((item) => {
                  const itemId = item.id || item._id

                  return (
                    <MenuItemCard
                      key={itemId}
                      item={item}
                      onAdd={(i) => {
                        addToCart(i)
                        push(`Added ${i.name} to cart`, 'success')
                      }}
                      onRemove={(i) => {
                        removeFromCart(i)
                        push(`Removed ${i.name} from cart`, 'info')
                      }}
                      quantity={state.cartItems[itemId]?.quantity || 0}
                    />
                  )
                })}
              </div>
            </motion.div>
          ))}

          {Object.keys(menuByCategory).length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <div className="text-5xl">🍽️</div>
              <h3 className="mt-4 text-lg font-extrabold text-gray-900">
                No menu items found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your food preference.
              </p>
              <button
                onClick={() => setVegFilter('all')}
                className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                Show all items
              </button>
            </div>
          )}
        </section>

        {/* REVIEWS */}
        <section className="mt-16 border-t border-gray-100 pt-10">
          <Reviews restaurantId={id} />
        </section>

      </main>
    </div>
  )
}
