
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-red-100 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Link to="/home" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-xl font-black text-white">
                A
              </span>

              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Apna<span className="text-red-600">Maal</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500 dark:text-gray-400">
              Your favourite food, delivered fresh and fast. Discover great
              restaurants and enjoy delicious meals at your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/home" className="transition hover:text-red-600">
                Home
              </Link>

              <Link to="/restaurants" className="transition hover:text-red-600">
                Restaurants
              </Link>

              <Link to="/cart" className="transition hover:text-red-600">
                My Cart
              </Link>

              <Link to="/profile" className="transition hover:text-red-600">
                My Profile
              </Link>
            </div>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Customer Support
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="transition hover:text-red-600">
                Login
              </Link>

              <Link to="/signup" className="transition hover:text-red-600">
                Create Account
              </Link>

              <Link to="/track" className="transition hover:text-red-600">
                Track Your Order
              </Link>
            </div>
          </div>

          {/* Promise */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Our Promise
            </h3>

            <div className="mt-4 space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <p>❤️ Made with care</p>
              <p>🚀 Fast delivery</p>
              <p>🔒 Secure experience</p>
              <p>🍽️ Delicious food</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-center dark:border-gray-800 sm:flex-row sm:text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {currentYear} ApnaMaal. All rights reserved.
          </p>

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Made with <span className="text-red-600">❤️</span> for speed,
            clarity, and trust.
          </p>
        </div>

      </div>
    </footer>
  )
}
