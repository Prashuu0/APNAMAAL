
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

function Favorites() {
  const { state, loadFavorites, toggleFavorite } = useApp();

  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const userId = state.user?._id || state.user?.id;

  // Load favorites when page opens
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId || state.user?.role !== "user") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        await loadFavorites(userId);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load favorites");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Remove restaurant from favorites
  const handleRemove = async (restaurant) => {
    const id = restaurant._id || restaurant.id;

    try {
      setRemovingId(id);
      setError("");

      await toggleFavorite(restaurant);
    } catch (err) {
      setError(err.message || "Unable to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  // Login check
  if (!state.user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">❤️</div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Login to view your favorites
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Save your favorite restaurants and find them here anytime.
        </p>

        <Link
          to="/login"
          className="mt-6 rounded-xl bg-red-500 px-6 py-3 text-white font-semibold hover:bg-red-600 transition"
        >
          Login Now
        </Link>
      </div>
    );
  }

  if (state.user.role !== "user") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300">
          Favorites are available for customer accounts only.
        </p>
      </div>
    );
  }

  const favorites = state.favorites || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            My Favorites ❤️
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Your favorite restaurants, all in one place.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-100 text-red-700 p-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          </div>
        ) : favorites.length === 0 ? (

          /* Empty Favorites */
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="text-7xl mb-5">💔</div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No Favorites Yet
            </h2>

            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md">
              You haven't saved any restaurants yet. Explore restaurants
              and tap the heart icon to add them here.
            </p>

            <Link
              to="/restaurants"
              className="mt-6 rounded-xl bg-red-500 px-6 py-3 text-white font-semibold hover:bg-red-600 transition"
            >
              Explore Restaurants
            </Link>
          </div>

        ) : (

          /* Favorites Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((restaurant, index) => {
              const restaurantId = restaurant._id || restaurant.id;

              if (!restaurantId) return null;

              return (
                <motion.div
                  key={restaurantId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="relative">
                    <Link to={`/restaurants/${restaurantId}`}>
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="h-48 w-full object-cover"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(restaurant)}
                      disabled={removingId === restaurantId}
                      className="absolute top-3 right-3 rounded-full bg-white p-3 shadow-lg text-red-500 hover:scale-110 transition disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      {removingId === restaurantId ? "..." : "❤️"}
                    </button>
                  </div>

                  <div className="p-4">
                    <Link to={`/restaurants/${restaurantId}`}>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-red-500 transition">
                        {restaurant.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {restaurant.cuisine}
                    </p>

                    <div className="mt-3 flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                      <span>⭐ {restaurant.rating || "New"}</span>
                      <span>{restaurant.deliveryTime || 30} mins</span>
                    </div>

                    <Link
                      to={`/restaurants/${restaurantId}`}
                      className="mt-4 block text-center rounded-xl bg-red-500 py-2.5 text-white font-semibold hover:bg-red-600 transition"
                    >
                      View Restaurant
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
