
import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

function RestaurantCard({ restaurant }) {
  const { state, toggleFavorite } = useApp();

  const [loading, setLoading] = useState(false);

  // Normalize restaurant ID
  const restaurantId = restaurant?.id || restaurant?._id;

  if (!restaurantId) {
    console.error("Restaurant missing ID:", restaurant);
    return null;
  }

  // Check whether restaurant is already favorite
  const isFavorite = state.favorites.some(
    (item) =>
      String(item?._id || item?.id || item) ===
      String(restaurantId)
  );

  // Handle favorite button
  const handleFavorite = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!state.user || state.user.role !== "user") {
      alert("Please login with your customer account to save favorites.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const result = await toggleFavorite(restaurant);

      if (!result.success && result.reason === "login") {
        alert("Please login to manage your favorites.");
      }
    } catch (error) {
      console.error("Favorite action failed:", error);
      alert(error.message || "Unable to update favorites. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Restaurant Image */}
      <div className="relative overflow-hidden">
        <Link to={`/restaurants/${restaurantId}`} className="group block">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavorite}
          disabled={loading}
          aria-label={
            isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
          aria-pressed={isFavorite}
          title={
            isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:opacity-60"
        >
          {loading ? (
            <svg
              className="h-5 w-5 animate-spin text-red-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className={`h-5 w-5 transition-colors ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "fill-none text-gray-700"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              />
            </svg>
          )}
        </button>

        {/* Restaurant Offer */}
        {restaurant.offer && (
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-lg">
            {restaurant.offer}
          </div>
        )}

        {/* Restaurant Status */}
        {restaurant.isOpen ? (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
            Open
          </div>
        ) : (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-gray-500 text-white text-xs font-medium">
            Closed
          </div>
        )}
      </div>

      {/* Restaurant Details */}
      <Link
        to={`/restaurants/${restaurantId}`}
        className="group block p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {restaurant.name}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {restaurant.cuisine}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
            <svg
              className="w-4 h-4 text-green-600 dark:text-green-400 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>

            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              {restaurant.rating}
            </span>
          </div>
        </div>

        {/* Delivery Time and Cost */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span>{restaurant.deliveryTime} mins</span>
          </div>

          {restaurant.costForTwo && (
            <span className="text-gray-500 dark:text-gray-400">
              ₹{restaurant.costForTwo} for two
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(RestaurantCard);
