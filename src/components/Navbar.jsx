
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useApp } from '../context/AppContext'

const dashboardPaths = {
  user: '/home',
  restaurant_owner: '/restaurant/dashboard',
  delivery: '/delivery/dashboard',
  admin: '/admin/dashboard',
}

const roleLabels = {
  user: 'Customer',
  restaurant_owner: 'Restaurant Owner',
  delivery: 'Delivery Partner',
  admin: 'Admin',
}

export default function Navbar() {
  const { getCartList, state, setUser } = useApp()
  const navigate = useNavigate()

  const user = state.user
  const role = user?.role
  const dashboardPath = dashboardPaths[role] || '/home'

  const cartItems = getCartList() || []
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const profileDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  const handleLogout = () => {
    setUser(null)
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  const closeMenus = () => {
    setMobileMenuOpen(false)
    setProfileDropdownOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `relative inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? 'text-red-600'
        : 'text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
      isActive
        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
        : 'text-gray-700 hover:bg-gray-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-gray-800'
    }`

  const renderRoleLinks = (mobile = false) => {
    const NavClass = mobile ? mobileLinkClass : linkClass
    const onClick = mobile ? closeMenus : undefined

    if (!user) {
      return (
        <>
          <NavLink to="/home" className={NavClass} onClick={onClick}>
            Home
          </NavLink>

          <NavLink to="/restaurants" className={NavClass} onClick={onClick}>
            Restaurants
          </NavLink>

          <NavLink to="/cart" className={NavClass} onClick={onClick}>
            Cart
            {cartCount > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </NavLink>
        </>
      )
    }

    if (role === 'user') {
      return (
        <>
          <NavLink to="/home" className={NavClass} onClick={onClick}>
            Home
          </NavLink>

          <NavLink to="/restaurants" className={NavClass} onClick={onClick}>
            Restaurants
          </NavLink>

          <NavLink to="/cart" className={NavClass} onClick={onClick}>
            Cart
            {cartCount > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </NavLink>

          {mobile && (
            <NavLink to="/profile" className={NavClass} onClick={onClick}>
              My Profile
            </NavLink>
          )}
        </>
      )
    }

    return (
      <NavLink to={dashboardPath} className={NavClass} onClick={onClick}>
        Dashboard
      </NavLink>
    )
  }

  const displayName = user?.name || user?.fullName || 'Account'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-red-100/70 bg-white/95 shadow-sm shadow-red-100/30 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link
          to={user ? dashboardPath : '/home'}
          onClick={closeMenus}
          className="group flex shrink-0 items-center gap-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-xl font-black text-white shadow-lg shadow-red-200 transition-transform duration-300 group-hover:scale-105 dark:shadow-red-950/40">
            A
          </span>

          <span className="text-[25px] font-black tracking-tight text-gray-900 dark:text-white">
            Apna<span className="text-red-600">Maal</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {renderRoleLinks()}

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <ThemeToggle />

          {!user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg dark:shadow-red-950/40"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 transition hover:border-red-200 hover:bg-red-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-bold text-white shadow-sm">
                  {initial}
                </div>

                <div className="max-w-[130px] text-left">
                  <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                    {displayName}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {roleLabels[role] || 'Account'}
                  </span>
                </div>

                <svg
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/30">
                  <div className="border-b border-gray-100 bg-red-50/70 px-4 py-4 dark:border-gray-700 dark:bg-red-950/20">
                    <p className="truncate font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {roleLabels[role] || 'Account'}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      to={dashboardPath}
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      My Dashboard
                    </Link>

                    {role === 'user' && (
                      <Link
                        to="/profile"
                        onClick={closeMenus}
                        className="block rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        My Profile
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 md:hidden">
          {user && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-bold text-white">
              {initial}
            </div>
          )}

          {!user && (
            <Link
              to="/login"
              className="text-sm font-bold text-red-600 hover:text-red-700"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-red-400"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-red-100 bg-white px-4 py-4 shadow-lg dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1">
            {renderRoleLinks(true)}

            <div className="my-3 border-t border-gray-100 dark:border-gray-800" />

            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Appearance
              </span>
              <ThemeToggle />
            </div>

            {!user ? (
              <Link
                to="/signup"
                onClick={closeMenus}
                className="mt-3 block rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white shadow-md shadow-red-100 transition hover:bg-red-700 dark:shadow-red-950/30"
              >
                Create Account
              </Link>
            ) : (
              <>
                <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  Logged in as: {roleLabels[role] || 'Account'}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800"
                >
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
