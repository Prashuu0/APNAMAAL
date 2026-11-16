
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchRestaurants, checkHealth } from '../services/api'
import RestaurantCard from '../components/RestaurantCard'
import { SkeletonCard } from '../components/Loader'
import Recommendations from '../components/Recommendations'

const collections = [
  {
    title: 'Newly Opened Spots',
    subtitle: 'Discover something new',
    query: 'new',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900',
  },
  {
    title: 'Best of Biryani',
    subtitle: 'Rich, aromatic & delicious',
    query: 'biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=900',
  },
  {
    title: 'Sweet Tooth',
    subtitle: 'Treat yourself today',
    query: 'dessert',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900',
  },
  {
    title: 'Healthy Picks',
    subtitle: 'Fresh and healthy meals',
    query: 'healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900',
  },
]

const categories = [
  { name: 'Pizza', emoji: '🍕', query: 'pizza' },
  { name: 'Burgers', emoji: '🍔', query: 'burger' },
  { name: 'Biryani', emoji: '🍛', query: 'biryani' },
  { name: 'Chinese', emoji: '🥡', query: 'chinese' },
  { name: 'Desserts', emoji: '🍰', query: 'dessert' },
  { name: 'South Indian', emoji: '🥘', query: 'south indian' },
  { name: 'Rolls', emoji: '🌯', query: 'rolls' },
  { name: 'Healthy', emoji: '🥗', query: 'healthy' },
]

const localities = {
  'Delhi NCR': ['Connaught Place', 'Saket', 'Hauz Khas', 'Rajouri Garden', 'Dwarka', 'Gurugram'],
  Mumbai: ['Bandra', 'Andheri', 'Juhu', 'Powai', 'Lower Parel', 'Colaba'],
  Bengaluru: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'MG Road', 'Jayanagar'],
  Hyderabad: ['Gachibowli', 'Hitech City', 'Banjara Hills', 'Jubilee Hills', 'Begumpet'],
  Pune: ['Koregaon Park', 'Viman Nagar', 'Kothrud', 'Hinjewadi', 'Baner', 'Wakad'],
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Delhi NCR')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])

  useEffect(() => {
    checkHealth().catch(() => {
      console.warn('API server not running')
    })

    setLoading(true)

    fetchRestaurants({ query: '' })
      .then((r) => setList(r || []))
      .catch((err) => {
        console.error('Error fetching restaurants:', err)
        setList([])
      })
      .finally(() => setLoading(false))
  }, [])

  function onSearch(e) {
    e?.preventDefault()
    navigate(`/restaurants?query=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-[#fffdfb] text-gray-900">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#fff3ef]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Your favourite food, delivered
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Cravings?
              <span className="block text-red-600">We've got you.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
              Discover the best restaurants around you and get delicious food
              delivered fresh to your doorstep.
            </p>

            <form onSubmit={onSearch} className="mt-8 rounded-2xl bg-white p-2 shadow-xl shadow-red-900/10 sm:flex">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-xl">📍</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm font-semibold text-gray-700 outline-none"
                >
                  {Object.keys(localities).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="hidden h-10 w-px self-center bg-gray-200 sm:block" />

              <div className="flex min-w-0 flex-[2] items-center gap-3 px-3">
                <span className="text-xl">🔍</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Restaurant, cuisine or dish..."
                  className="w-full min-w-0 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-red-600 px-7 py-3.5 font-bold text-white transition hover:bg-red-700 sm:mt-0 sm:w-auto"
              >
                Search Food
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-5 text-sm text-gray-600">
              <span>✓ Easy ordering</span>
              <span>✓ Fresh food</span>
              <span>✓ Live tracking</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-5 -top-5 h-40 w-40 rounded-full bg-red-200/60 blur-3xl" />
            <div className="absolute -bottom-5 -left-5 h-40 w-40 rounded-full bg-orange-200/70 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-red-900/15">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop"
                alt="Delicious food spread"
                className="h-[300px] w-full object-cover sm:h-[420px]"
              />

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Made with love</p>
                    <p className="mt-1 text-lg font-extrabold text-gray-900">Good food. Good mood.</p>
                  </div>
                  <span className="text-3xl">❤️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOD CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">Explore menu</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">What are you craving?</h2>
          </div>
          <Link to="/restaurants" className="text-sm font-bold text-red-600 hover:text-red-700">
            View all →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-8">
          {categories.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(`/restaurants?query=${encodeURIComponent(item.query)}`)}
              className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1ed] text-3xl transition group-hover:scale-110 sm:h-16 sm:w-16">
                {item.emoji}
              </span>
              <span className="mt-3 text-center text-xs font-bold text-gray-700 sm:text-sm">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* SPECIAL OFFER BANNER */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-orange-500 px-6 py-9 text-white sm:px-12 sm:py-12">
          <div className="relative z-10 max-w-xl">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Special treats
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Delicious food is just a few clicks away!
            </h2>
            <p className="mt-3 text-sm text-white/85 sm:text-base">
              Explore restaurants and discover your next favourite meal.
            </p>
            <Link
              to="/restaurants"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-red-700 transition hover:bg-red-50"
            >
              Explore Restaurants →
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-5 -top-12 text-[190px] opacity-20 sm:right-12 sm:text-[230px]">
            🍔
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-red-600">Handpicked for you</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Explore collections</h2>
          <p className="mt-2 text-gray-500">Find something delicious for every mood.</p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((item) => (
            <Link
              key={item.title}
              to={`/restaurants?query=${encodeURIComponent(item.query)}`}
              className="group relative overflow-hidden rounded-2xl shadow-sm"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <h3 className="text-lg font-extrabold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/80">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECOMMENDATIONS */}
      {!loading && list.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <Recommendations restaurants={list} />
        </section>
      )}

      {/* FEATURED RESTAURANTS */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">Popular near you</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Featured restaurants</h2>
            <p className="mt-2 text-sm text-gray-500">Discover places worth ordering from.</p>
          </div>
          <Link to="/restaurants" className="text-sm font-bold text-red-600 hover:text-red-700">
            View all →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : list.length > 0 ? (
            list.slice(0, 6).map((r) => (
              <RestaurantCard key={r.id || r._id} restaurant={r} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
              <div className="text-4xl">🍽️</div>
              <h3 className="mt-3 text-lg font-bold">No restaurants found</h3>
              <p className="mt-1 text-sm text-gray-500">Please try again in a little while.</p>
              <Link to="/restaurants" className="mt-4 inline-block font-bold text-red-600">
                Browse restaurants →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* POPULAR LOCALITIES */}
      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-sm font-bold uppercase tracking-wider text-red-600">Find food nearby</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Popular localities in {city}
          </h2>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(localities[city] || localities['Delhi NCR']).map((loc) => (
              <button
                key={loc}
                onClick={() => navigate(`/restaurants?query=${encodeURIComponent(loc)}`)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-red-300 hover:shadow-md"
              >
                <p className="font-bold text-gray-800">{loc}</p>
                <p className="mt-1 text-xs text-gray-500">Explore restaurants →</p>
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
