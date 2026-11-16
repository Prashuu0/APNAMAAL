import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchRestaurants } from '../services/api'
import RestaurantCard from '../components/RestaurantCard'
import { SkeletonCard } from '../components/Loader'
import { debounce } from '../utils/debounce'

import RestaurantMap from '../components/RestaurantMap'

const PAGE_SIZE = 12

export default function RestaurantList() {
  const [params] = useSearchParams()
  const initialQ = useMemo(() => params.get('query') || '', [params])

  const [query, setQuery] = useState(initialQ)
  const [searchQuery, setSearchQuery] = useState(initialQ)
  const [cuisine, setCuisine] = useState('')
  const [sort, setSort] = useState('relevance')
  const [onlyOffers, setOnlyOffers] = useState(false)
  const [dietaryFilter, setDietaryFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  })

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value)
      setPage(1)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  useEffect(() => {
    let isCurrent = true

    async function loadRestaurants() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchRestaurants({
          query: searchQuery,
          cuisine,
          page,
          limit: PAGE_SIZE,
          sort,
        })

        // New paginated API response: { success, restaurants, pagination }
        const restaurants = Array.isArray(response)
          ? response
          : Array.isArray(response?.restaurants)
            ? response.restaurants
            : []

        const normalizedList = restaurants.map((restaurant) => ({
          ...restaurant,
          id: restaurant._id || restaurant.id,
        }))

        if (!isCurrent) return

        setList(normalizedList)
        setPagination(
          response?.pagination || {
            page,
            limit: PAGE_SIZE,
            total: normalizedList.length,
            totalPages: 1,
            hasNextPage: false,
          }
        )
      } catch (err) {
        if (!isCurrent) return
        console.error('Restaurant loading error:', err)
        setError(err.message || 'Failed to load restaurants')
        setList([])
        setPagination({
          page: 1,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
        })
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    loadRestaurants()

    return () => {
      isCurrent = false
    }
  }, [searchQuery, cuisine, sort, page])

  const filteredSorted = useMemo(() => {
    let arr = [...list]

    // Offers are filtered on the currently loaded page.
    if (onlyOffers) {
      arr = arr.filter((restaurant) => restaurant.offer)
    }

    // Dietary filtering needs reliable dietary/menu data from the API.
    // Keep the existing selector until that data is consistently available.
    return arr
  }, [list, onlyOffers])

  const cuisines = useMemo(() => {
    return [...new Set(list.map((restaurant) => restaurant.cuisine).filter(Boolean))]
  }, [list])

  function clearFilters() {
    setQuery('')
    setSearchQuery('')
    setCuisine('')
    setSort('relevance')
    setOnlyOffers(false)
    setDietaryFilter('all')
    setPage(1)
  }

  function changeCuisine(value) {
    setCuisine(value)
    setPage(1)
  }

  function changeSort(value) {
    setSort(value)
    setPage(1)
  }

  function goToPage(nextPage) {
    const totalPages = Math.max(1, Number(pagination.totalPages) || 1)
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalCount = Number(pagination.total) || 0
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1)

  return (
    <div className="min-h-screen bg-[#fffdfb]">
      {/* PAGE HEADER */}
      <section className="border-b border-red-100 bg-[#fff3ef]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Explore ApnaMaal
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
              Discover restaurants
              <span className="block text-red-600">you'll love.</span>
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              From your favourite comfort food to exciting new flavours,
              find your next delicious meal.
            </p>
          </div>

          {/* SEARCH */}
          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white p-2 shadow-lg shadow-red-900/5">
              <span className="pl-3 text-xl">🔍</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search restaurants, cuisines or dishes..."
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />

              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* FILTER PANEL */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Find your perfect meal
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Customize your search with filters
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              Reset filters ↺
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* CUISINE */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Cuisine
              </label>
              <select
                value={cuisine}
                onChange={(event) => changeCuisine(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#fffdfb] px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">All Cuisines</option>
                {cuisines.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* SORT */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(event) => changeSort(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#fffdfb] px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating: High to Low</option>
                <option value="time">Delivery Time</option>
                <option value="cost">Cost for Two</option>
              </select>
            </div>

            {/* DIETARY */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Food Preference
              </label>
              <select
                value={dietaryFilter}
                onChange={(event) => setDietaryFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#fffdfb] px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All Food</option>
                <option value="veg">🌿 Pure Veg</option>
                <option value="non-veg">🍗 Non-Veg</option>
              </select>
            </div>

            {/* OFFERS */}
            <div className="flex items-end">
              <label
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  onlyOffers
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-[#fffdfb] hover:border-red-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={onlyOffers}
                  onChange={(event) => setOnlyOffers(event.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                <span className="text-sm font-bold text-gray-700">
                  🏷️ Offers Only
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* RESULTS HEADER */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Fresh & delicious
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-gray-950">
                Restaurants near you
              </h2>
              {!loading && !error && (
                <p className="mt-1 text-sm text-gray-500">
                  {onlyOffers
                    ? `${filteredSorted.length} offers on this page`
                    : `${totalCount.toLocaleString()} restaurants found`}
                  {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                </p>
              )}
            </div>

            <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
              ❤️ Made for food lovers
            </span>
          </div>
        </section>

        {/* RESTAURANT MAP */}
<div className="mt-8">
  <RestaurantMap restaurants={list} />
</div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-red-800">{error}</p>
                <p className="mt-1 text-sm text-red-600">
                  Something went wrong while loading restaurants.
                </p>
              </div>
              <button
                onClick={() => {
                  setPage(1)
                  setSearchQuery(query)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* LOADING / RESULTS */}
        {loading ? (
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredSorted.length > 0 ? (
          <>
            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSorted.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                />
              ))}
            </div>

            {/* PAGINATION */}
            {!onlyOffers && totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="px-3 text-sm font-semibold text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : !error ? (
          <div className="mt-7 rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
              🍽️
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-gray-900">
              No restaurants found
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Try another search or reset your filters to discover more delicious options.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Clear all filters
            </button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
