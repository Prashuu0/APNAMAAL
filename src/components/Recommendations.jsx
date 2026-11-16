import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

export default function Recommendations({ restaurants = [] }) {
  const { state } = useApp()

  // Get recommendations based on:
  // 1. Past orders (if available)
  // 2. High ratings
  // 3. Popular restaurants
  const recommended = useMemo(() => {
    let rec = [...restaurants]
    
    // Boost restaurants with high ratings
    rec.sort((a, b) => {
      let scoreA = a.rating
      let scoreB = b.rating
      
      // If user has order history, prioritize restaurants they've ordered from
      if (state.orderHistory?.length > 0) {
        const orderedRestaurantIds = new Set(
          state.orderHistory
            .flatMap(order => order.items?.map(({ item }) => item?.restaurantId) || [])
            .filter(Boolean)
        )
        if (orderedRestaurantIds.has(a.id)) scoreA += 0.5
        if (orderedRestaurantIds.has(b.id)) scoreB += 0.5
      }
      
      // Boost restaurants with offers
      if (a.offer) scoreA += 0.3
      if (b.offer) scoreB += 0.3
      
      return scoreB - scoreA
    })
    
    return rec.slice(0, 6)
  }, [restaurants, state.orderHistory])

  if (recommended.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {state.orderHistory?.length > 0 ? 'Recommended for You' : 'Top Picks'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {state.orderHistory?.length > 0 
              ? 'Based on your order history and preferences'
              : 'Handpicked restaurants with great ratings'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommended.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/restaurants/${restaurant.id}`} className="group block">
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {restaurant.rating >= 4.5 && (
                      <div className="px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                        ⭐ Top Rated
                      </div>
                    )}
                    {state.orderHistory?.some(order => 
                      order.items?.some(({ item }) => item?.restaurantId === restaurant.id)
                    ) && (
                      <div className="px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg">
                        🕐 Previously Ordered
                      </div>
                    )}
                  </div>
                  {restaurant.offer && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-lg">
                      {restaurant.offer}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{restaurant.cuisine}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white">{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{restaurant.deliveryTime} mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

