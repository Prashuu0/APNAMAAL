
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Cart() {
  const { getCartList, getCartTotals, addToCart, removeFromCart, clearCart } = useApp()

  const items = getCartList()
  const totals = getCartTotals()
  const itemCount = items.reduce((sum, { quantity }) => sum + quantity, 0)
  const freeDeliveryTarget = 500
  const remainingForFreeDelivery = Math.max(0, freeDeliveryTarget - totals.subtotal)
  const freeDeliveryProgress = Math.min(100, (totals.subtotal / freeDeliveryTarget) * 100)

  return (
    <div className="min-h-screen bg-[#fffdfb]">

      {/* CART HEADER */}
      <section className="border-b border-red-100 bg-[#fff3ef]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600">
            Your ApnaMaal basket
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Your Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Delicious choices deserve a delicious delivery.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Your next delicious meal is waiting. Explore restaurants and add
              your favourite dishes.
            </p>

            <Link
              to="/restaurants"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              Explore Restaurants →
            </Link>
          </motion.div>
        ) : (
          <>
            {/* CART PROGRESS */}
            <div className="mb-8 rounded-2xl border border-green-100 bg-green-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-gray-900">
                    {remainingForFreeDelivery === 0
                      ? '🎉 You unlocked free delivery!'
                      : '🚚 You are close to free delivery!'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {remainingForFreeDelivery === 0
                      ? 'Enjoy free delivery on this order.'
                      : `Add ₹${remainingForFreeDelivery} more to unlock free delivery.`}
                  </p>
                </div>

                <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-green-700">
                  {Math.round(freeDeliveryProgress)}% completed
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-green-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${freeDeliveryProgress}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.4fr_0.8fr]">

              {/* CART ITEMS */}
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-950">
                      Your Items
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {itemCount} items in your cart
                    </p>
                  </div>

                  <button
                    onClick={clearCart}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map(({ item, quantity }) => {
                      const itemId = item.id || item._id

                      return (
                        <motion.div
                          key={itemId}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
                        >
                          {/* FOOD IMAGE */}
                          <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-[#fff3ef] sm:h-24 sm:w-24">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl">
                                🍽️
                              </div>
                            )}
                          </div>

                          {/* FOOD DETAILS */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate font-extrabold text-gray-900">
                                  {item.name}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  ₹{item.price} per item
                                </p>
                              </div>

                              {item.veg !== undefined && (
                                <span
                                  title={item.veg ? 'Vegetarian' : 'Non-vegetarian'}
                                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    item.veg
                                      ? 'border-green-600'
                                      : 'border-red-600'
                                  }`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      item.veg ? 'bg-green-600' : 'bg-red-600'
                                    }`}
                                  />
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              {/* QUANTITY CONTROL */}
                              <div className="flex items-center overflow-hidden rounded-xl border border-red-100 bg-red-50">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeFromCart(item)}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                  className="flex h-9 w-10 items-center justify-center text-lg font-bold text-red-600 transition hover:bg-red-100"
                                >
                                  −
                                </motion.button>

                                <span className="min-w-9 text-center text-sm font-extrabold text-gray-900">
                                  {quantity}
                                </span>

                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addToCart(item)}
                                  aria-label={`Increase quantity of ${item.name}`}
                                  className="flex h-9 w-10 items-center justify-center text-lg font-bold text-red-600 transition hover:bg-red-100"
                                >
                                  +
                                </motion.button>
                              </div>

                              <p className="text-lg font-extrabold text-gray-900">
                                ₹{item.price * quantity}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                <Link
                  to="/restaurants"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-red-600 transition hover:text-red-700"
                >
                  ← Add more delicious food
                </Link>
              </section>

              {/* PRICE SUMMARY */}
              <motion.aside
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:sticky lg:top-24"
              >
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600">
                    Order details
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-gray-950">
                    Price Summary
                  </h2>

                  {/* PRICING INFORMATION */}
                  <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <p className="text-sm font-extrabold text-green-800">
                        Transparent Pricing
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-green-700">
                      All charges are displayed upfront. No hidden surprises.
                    </p>
                  </div>

                  {/* PRICE BREAKDOWN */}
                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="font-bold text-gray-900">
                        ₹{totals.subtotal}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className={`font-bold ${
                        remainingForFreeDelivery === 0
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}>
                        {remainingForFreeDelivery === 0
                          ? 'FREE'
                          : `₹${totals.delivery}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Tax (5%)</span>
                      <span className="font-bold text-gray-900">
                        ₹{totals.tax}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-gray-900">
                          Total Amount
                        </span>
                        <span className="text-2xl font-extrabold text-red-600">
                          ₹{totals.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CHECKOUT BUTTON */}
                  <Link
                    to="/checkout"
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl"
                  >
                    Proceed to Checkout
                    <span className="text-lg">→</span>
                  </Link>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>🔒</span>
                    Secure checkout experience
                  </div>
                </div>
              </motion.aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
