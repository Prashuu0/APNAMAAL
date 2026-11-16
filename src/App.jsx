
import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TransitionWrapper from './components/TransitionWrapper'
import Loader from './components/Loader'
import { useApp } from './context/AppContext'
import Favorites from "./pages/Favorites";

// Lazy pages
const Landing = lazy(() => import('./pages/Landing'))
const Home = lazy(() => import('./pages/Home'))
const RestaurantList = lazy(() => import('./pages/RestaurantList'))
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

// Redirect user to their own dashboard
function getDashboardPath(role) {
  switch (role) {
    case 'user':
      return '/home'
    case 'restaurant_owner':
      return '/restaurant/dashboard'
    case 'delivery':
      return '/delivery/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/'
  }
}

// Protected route
function ProtectedRoute({ children, allowedRoles }) {
  const { state: { user } } = useApp()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    )
  }

  return children
}

// Customer pages: allow guests to browse,
// but prevent other logged-in roles from entering.
function CustomerArea({ children }) {
  const { state: { user } } = useApp()

  if (user && user.role !== 'user') {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    )
  }

  return children
}

// Decide the correct page for logged-in users
function RoleHomeRedirect() {
  const { state: { user } } = useApp()

  if (!user) {
    return <Landing />
  }

  return (
    <Navigate
      to={getDashboardPath(user.role)}
      replace
    />
  )
}

export default function App() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<RoleHomeRedirect />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main application */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">

              <Navbar />

              <main className="flex-1">
                <TransitionWrapper>
                  <Routes>

                    {/* Customer area */}
                    <Route
                      path="/home"
                      element={
                        <CustomerArea>
                          <Home />
                        </CustomerArea>
                      }
                    />

                    <Route
                      path="/restaurants"
                      element={
                        <CustomerArea>
                          <RestaurantList />
                        </CustomerArea>
                      }
                    />

                    <Route
                      path="/restaurants/:id"
                      element={
                        <CustomerArea>
                          <RestaurantDetail />
                        </CustomerArea>
                      }
                    />

                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Cart />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/track"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <TrackOrder />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Restaurant Owner */}
                    <Route
                      path="/restaurant/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['restaurant_owner']}>
                          <OwnerDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/favorites" element={<Favorites />} />

                    {/* Delivery Partner */}
                    <Route
                      path="/delivery/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['delivery']}>
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Unknown route */}
                    <Route
                      path="*"
                      element={<RoleHomeRedirect />}
                    />

                  </Routes>
                </TransitionWrapper>
              </main>

              <Footer />

            </div>
          }
        />

      </Routes>
    </Suspense>
  )
}
