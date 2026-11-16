import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Reviews({ restaurantId, reviews = [] }) {
  const [filter, setFilter] = useState('all') // all, positive, negative
  const [showAll, setShowAll] = useState(false)

  // If no reviews provided, use mock data
  const mockReviews = reviews.length > 0 ? reviews : [
    {
      id: 1,
      userName: 'Rahul K.',
      rating: 5,
      date: '2 days ago',
      comment: 'Amazing food quality! Fast delivery and packaging was perfect. Highly recommend!',
      sentiment: 'positive',
      pros: ['Fast delivery', 'Great taste'],
      cons: []
    },
    {
      id: 2,
      userName: 'Priya S.',
      rating: 4,
      date: '1 week ago',
      comment: 'Good food but delivery was a bit late. Overall satisfied.',
      sentiment: 'positive',
      pros: ['Good taste', 'Fresh food'],
      cons: ['Late delivery']
    },
    {
      id: 3,
      userName: 'Amit R.',
      rating: 3,
      date: '2 weeks ago',
      comment: 'Average food quality. Expected better for the price.',
      sentiment: 'negative',
      pros: [],
      cons: ['Pricey', 'Average quality']
    },
    {
      id: 4,
      userName: 'Sneha M.',
      rating: 5,
      date: '3 days ago',
      comment: 'Best biryani in town! Must try. Will order again.',
      sentiment: 'positive',
      pros: ['Excellent taste', 'Good quantity'],
      cons: []
    },
  ]

  const filteredReviews = mockReviews.filter(r => {
    if (filter === 'positive') return r.sentiment === 'positive' || r.rating >= 4
    if (filter === 'negative') return r.sentiment === 'negative' || r.rating <= 2
    return true
  })

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3)
  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1)
  const positiveCount = mockReviews.filter(r => r.rating >= 4).length
  const negativeCount = mockReviews.filter(r => r.rating <= 2).length

  return (
    <div className="mt-8 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reviews & Ratings</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{avgRating}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">({mockReviews.length} reviews)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {positiveCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                {positiveCount} Positive
              </span>
            )}
            {negativeCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">
                {negativeCount} Needs Work
              </span>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-red-500 dark:bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({mockReviews.length})
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'positive'
                ? 'bg-green-500 dark:bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Positive ({positiveCount})
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'negative'
                ? 'bg-red-500 dark:bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Needs Work ({negativeCount})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence>
          {displayedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 ${
                review.sentiment === 'positive'
                  ? 'border-green-100 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
                  : review.sentiment === 'negative'
                  ? 'border-red-100 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{review.userName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                {review.sentiment === 'positive' && (
                  <span className="px-2 py-1 rounded bg-green-500 text-white text-xs font-medium">
                    ✓ Recommended
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{review.comment}</p>
              
              {/* Pros/Cons */}
              {(review.pros?.length > 0 || review.cons?.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {review.pros?.map((pro, i) => (
                    <span
                      key={`pro-${i}`}
                      className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium"
                    >
                      ✓ {pro}
                    </span>
                  ))}
                  {review.cons?.map((con, i) => (
                    <span
                      key={`con-${i}`}
                      className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium"
                    >
                      ✗ {con}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredReviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${filteredReviews.length} Reviews`}
        </button>
      )}
    </div>
  )
}

