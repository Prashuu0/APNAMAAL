
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { placeOrder, validateCoupon } from '../services/api'
import { useToast } from '../components/Toast'
import { motion } from 'framer-motion'

export default function Checkout() {
  const navigate = useNavigate()
  const { getCartList, getCartTotals, clearCart, setLastOrder, state } = useApp()

  const items = getCartList()
  const totals = getCartTotals()
  const { push } = useToast()

  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('COD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  async function onApplyCoupon() {
    if (!couponCode.trim()) {
      setCouponMessage('Please enter a coupon code')
      return
    }

    try {
      setCouponLoading(true)
      setCouponMessage('')

      const result = await validateCoupon(
        couponCode.trim().toUpperCase(),
        totals.subtotal
      )

      const discount = Number(result.discount ?? result.data?.discount ?? 0)

      if (result.valid === false || discount <= 0) {
        setCouponDiscount(0)
        setCouponMessage(result.message || 'Invalid coupon code')
        return
      }

      setCouponDiscount(discount)
      setCouponMessage(`Coupon applied successfully! You saved ₹${discount}`)
    } catch (err) {
      setCouponDiscount(0)
      setCouponMessage(err.message || 'Unable to apply coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  async function onPlaceOrder() {
    if (items.length === 0) {
      push('Your cart is empty', 'error')
      return
    }

    if (!address.trim()) {
      setError('Please enter your delivery address')
      return
    }

    if (scheduled && (!scheduleDate || !scheduleTime)) {
      setError('Please select date and time for scheduled delivery')
      return
    }

    if (!state.user?._id && !state.user?.id) {
      setError('Please login before placing your order')
      push('Please login before placing your order', 'error')
      return
    }

    try {
      setError('')
      setLoading(true)

      const userId = state.user?._id || state.user?.id

      const restaurantId =
        items[0]?.item?.restaurantId ||
        items[0]?.item?.restaurant?.id ||
        items[0]?.item?.restaurant?._id ||
        null

      if (!restaurantId) {
        throw new Error('Restaurant not found. Please add items to cart again.')
      }

      const orderData = {
        userId,
        restaurantId,
        items,
        address,
        paymentMethod: payment,
        scheduled,
        scheduleDate: scheduled ? scheduleDate : null,
        scheduleTime: scheduled ? scheduleTime : null,
        couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : null,
      }

      const order = await placeOrder(orderData)

      if (!order || !order.orderId) {
        throw new Error('Invalid order response from server')
      }

      setLastOrder(order)
      push(
        scheduled ? 'Order scheduled successfully!' : 'Order placed successfully!',
        'success'
      )

      clearCart()

      setTimeout(() => {
        navigate('/track')
      }, 1500)
    } catch (err) {
      console.error('Error placing order:', err)
      const message = err.message || 'Failed to place order. Please try again.'
      setError(message)
      push(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const finalTotal = Math.max(0, totals.total - couponDiscount)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffdfb] px-5 py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl">
            🛒
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Looks like you haven't added anything delicious yet.
          </p>
          <button
            onClick={() => navigate('/restaurants')}
            className="mt-7 rounded-xl bg-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-700"
          >
            Explore Restaurants →
          </button>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-[#fffdfb] px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'

  const sectionClass =
    'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6'

  return (
    <div className="min-h-screen bg-[#fffdfb]">

      {/* CHECKOUT HEADER */}
      <section className="border-b border-red-100 bg-[#fff3ef]">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600">
            Almost there!
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Complete your order
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Just a few details and your favourite food will be on its way.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="rounded-full bg-green-100 px-4 py-2 text-green-700">
              ✓ Cart
            </span>
            <span className="text-red-400">━━━━</span>
            <span className="rounded-full bg-red-600 px-4 py-2 text-white">
              2. Checkout
            </span>
            <span className="text-gray-300">━━━━</span>
            <span className="rounded-full bg-white px-4 py-2 text-gray-500">
              3. Delivery
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.35fr_0.85fr]">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* DELIVERY ADDRESS */}
            <motion.section
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className={sectionClass}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
                  📍
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Delivery Address
                  </h2>
                  <p className="text-xs text-gray-500">
                    Where should we deliver your food?
                  </p>
                </div>
              </div>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                placeholder="House/Flat number, street, area, city, landmark and PIN code..."
                className={inputClass + ' resize-none'}
              />

              <p className="mt-2 text-xs text-gray-400">
                Please provide a complete address for smooth delivery.
              </p>
            </motion.section>

            {/* SCHEDULE ORDER */}
            <motion.section
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className={sectionClass}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                  🕒
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Delivery Schedule
                  </h2>
                  <p className="text-xs text-gray-500">
                    Get your order when you want it.
                  </p>
                </div>
              </div>

              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${
                scheduled
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-100 bg-[#fffdfb] hover:border-red-200'
              }`}>
                <input
                  type="checkbox"
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                  className="h-5 w-5 accent-red-600"
                />
                <div>
                  <p className="font-bold text-gray-900">Schedule for later</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose your preferred delivery date and time.
                  </p>
                </div>
              </label>

              {scheduled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={today}
                      max={maxDate}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Delivery Time
                    </label>
                    <select
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choose time</option>
                      {[
                        '10:00', '11:00', '12:00', '13:00',
                        '14:00', '15:00', '16:00', '17:00',
                        '18:00', '19:00', '20:00', '21:00', '22:00',
                      ].map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {scheduleDate && scheduleTime && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:col-span-2">
                      <p className="text-sm text-blue-800">
                        📅 Scheduled for{' '}
                        <strong>
                          {new Date(`${scheduleDate}T00:00:00`).toLocaleDateString(
                            'en-IN',
                            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </strong>
                        {' '}at <strong>{scheduleTime}</strong>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.section>

            {/* PAYMENT METHOD */}
            <motion.section
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={sectionClass}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-xl">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Payment Method
                  </h2>
                  <p className="text-xs text-gray-500">
                    Select how you want to pay.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { value: 'COD', label: 'Cash on Delivery', icon: '💵', description: 'Pay when delivered' },
                  { value: 'UPI', label: 'UPI', icon: '📱', description: 'Pay using UPI' },
                  { value: 'Card', label: 'Debit / Credit', icon: '💳', description: 'Pay using card' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
                      payment === method.value
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{method.icon}</span>
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={payment === method.value}
                        onChange={() => setPayment(method.value)}
                        className="h-4 w-4 accent-red-600"
                      />
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-gray-900">
                      {method.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {method.description}
                    </p>
                  </label>
                ))}
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
          <motion.aside
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <section className={sectionClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Your order
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-gray-950">
                    Order Summary
                  </h2>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                  {itemCount} items
                </span>
              </div>

              {/* ORDER ITEMS */}
              <div className="mt-6 max-h-64 space-y-4 overflow-y-auto">
                {items.map(({ item, quantity }) => {
                  const itemId = item.id || item._id

                  return (
                    <div key={itemId} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3ef] text-lg">
                          🍽️
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Qty: {quantity}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-gray-900">
                        ₹{item.price * quantity}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* COUPON */}
              <div className="mt-6 border-t border-dashed border-gray-200 pt-5">
                <label className="mb-2 block text-sm font-extrabold text-gray-800">
                  🏷️ Have a coupon code?
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponDiscount(0)
                      setCouponMessage('')
                    }}
                    placeholder="Enter coupon"
                    disabled={couponLoading || loading}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-[#fffdfb] px-3 py-3 text-sm uppercase outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={onApplyCoupon}
                    disabled={couponLoading || loading}
                    className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {couponLoading ? 'Wait...' : 'Apply'}
                  </button>
                </div>

                {couponMessage && (
                  <p className={`mt-2 text-xs font-semibold ${
                    couponDiscount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Item subtotal</span>
                  <span className="font-semibold text-gray-900">₹{totals.subtotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-gray-900">₹{totals.delivery}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-gray-900">₹{totals.tax}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Coupon discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-gray-900">
                      Grand Total
                    </span>
                    <span className="text-2xl font-extrabold text-red-600">
                      ₹{finalTotal}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-xs text-gray-400">
                    Inclusive of displayed charges
                  </p>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                  ⚠️ {error}
                </div>
              )}

              {/* PLACE ORDER */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={loading || items.length === 0}
                onClick={onPlaceOrder}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Placing your order...
                  </>
                ) : (
                  <>
                    Place Order · ₹{finalTotal}
                    <span className="text-lg">→</span>
                  </>
                )}
              </motion.button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>🔒</span>
                Your order details are securely submitted.
              </div>
            </section>
          </motion.aside>
        </div>
      </main>
    </div>
  )
}
