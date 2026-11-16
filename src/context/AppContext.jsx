
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
} from "react";

import {
  clearAuthToken,
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from "../services/api";

const AppContext = createContext(null);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  cartItems: {},
  user: null,
  lastOrder: null,
  orderHistory: [],
  favorites: [],
};

// ============================================
// APP REDUCER
// ============================================

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { item, userRole } = action;

      if (userRole && userRole !== "user") {
        console.warn("Only customers can place orders");
        return state;
      }

      const itemId = item?.id || item?._id;

      if (!itemId) {
        console.error("Item missing ID:", item);
        return state;
      }

      const existing = state.cartItems[itemId]?.quantity || 0;

      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [itemId]: {
            item,
            quantity: existing + 1,
          },
        },
      };
    }

    case "REMOVE_FROM_CART": {
      const { item, userRole } = action;

      if (userRole && userRole !== "user") {
        console.warn("Only customers can modify cart");
        return state;
      }

      const itemId = item?.id || item?._id;

      if (!itemId) {
        console.error("Item missing ID:", item);
        return state;
      }

      const existing = state.cartItems[itemId]?.quantity || 0;

      if (!existing) return state;

      const nextQty = existing - 1;
      const next = { ...state.cartItems };

      if (nextQty <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = {
          item,
          quantity: nextQty,
        };
      }

      return {
        ...state,
        cartItems: next,
      };
    }

    case "CLEAR_CART": {
      return {
        ...state,
        cartItems: {},
      };
    }

    // ============================================
    // FAVORITES
    // ============================================

    case "SET_FAVORITES": {
      return {
        ...state,
        favorites: action.favorites || [],
      };
    }

    case "ADD_FAVORITE": {
      const restaurantId = String(action.restaurantId);

      const alreadyExists = state.favorites.some(
        (item) =>
          String(item?._id || item?.id || item) === restaurantId
      );

      if (alreadyExists) return state;

      return {
        ...state,
        favorites: [...state.favorites, action.restaurant],
      };
    }

    case "REMOVE_FAVORITE": {
      const restaurantId = String(action.restaurantId);

      return {
        ...state,
        favorites: state.favorites.filter(
          (item) =>
            String(item?._id || item?.id || item) !== restaurantId
        ),
      };
    }

    // ============================================
    // USER
    // ============================================

    case "SET_USER": {
      const oldUserId = state.user?._id || state.user?.id;
      const newUserId = action.user?._id || action.user?.id;

      const accountChanged =
        oldUserId && newUserId && oldUserId !== newUserId;

      return {
        ...state,
        user: action.user,
        ...(accountChanged
          ? {
              cartItems: {},
              lastOrder: null,
              orderHistory: [],
              favorites: [],
            }
          : {}),
      };
    }

    case "LOGOUT": {
      return {
        ...state,
        user: null,
        cartItems: {},
        lastOrder: null,
        orderHistory: [],
        favorites: [],
      };
    }

    // ============================================
    // ORDERS
    // ============================================

    case "SET_LAST_ORDER": {
      const newOrder = {
        ...action.order,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        lastOrder: newOrder,
        orderHistory: [newOrder, ...state.orderHistory].slice(0, 50),
      };
    }

    case "REORDER": {
      if (state.user?.role !== "user") {
        console.warn("Only customers can reorder");
        return state;
      }

      const { order } = action;
      const items = {};

      order.items.forEach(({ item, quantity }) => {
        const itemId = item?.id || item?._id;

        if (itemId) {
          items[itemId] = {
            item,
            quantity,
          };
        }
      });

      return {
        ...state,
        cartItems: items,
      };
    }

    default:
      return state;
  }
}

// ============================================
// APP PROVIDER
// ============================================

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (init) => {
      try {
        const persisted = JSON.parse(
          localStorage.getItem("apnaMaalState") || "null"
        );

        if (!persisted) return init;

        const token = localStorage.getItem("apnamaal_token");

        return {
          ...init,
          ...persisted,
          cartItems: persisted.cartItems || {},
          orderHistory: persisted.orderHistory || [],
          favorites: persisted.favorites || [],
          user: token ? persisted.user || null : null,
          lastOrder: persisted.lastOrder || null,
        };
      } catch (error) {
        console.error("Error restoring app state:", error);
        return init;
      }
    }
  );

  // Persist application state
  useEffect(() => {
    localStorage.setItem("apnaMaalState", JSON.stringify(state));
  }, [state]);

  // ============================================
  // LOAD FAVORITES FROM BACKEND
  // ============================================

  useEffect(() => {
    const userId = state.user?._id || state.user?.id;

    if (!userId || state.user?.role !== "user") {
      dispatch({
        type: "SET_FAVORITES",
        favorites: [],
      });

      return;
    }

    let cancelled = false;

    const loadUserFavorites = async () => {
      try {
        const result = await fetchFavorites(userId);

        if (!cancelled) {
          dispatch({
            type: "SET_FAVORITES",
            favorites: result.favorites || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load favorites:", error);
        }
      }
    };

    loadUserFavorites();

    return () => {
      cancelled = true;
    };
  }, [state.user?._id, state.user?.id, state.user?.role]);

  // ============================================
  // MANUAL LOAD FAVORITES
  // ============================================

  const loadFavorites = async (userId) => {
    if (!userId) return;

    const result = await fetchFavorites(userId);

    dispatch({
      type: "SET_FAVORITES",
      favorites: result.favorites || [],
    });
  };

  // ============================================
  // TOGGLE FAVORITE
  // ============================================

  const toggleFavorite = async (restaurant) => {
    const userId = state.user?._id || state.user?.id;
    const restaurantId = restaurant?._id || restaurant?.id;

    if (!userId || state.user?.role !== "user") {
      return {
        success: false,
        reason: "login",
      };
    }

    if (!restaurantId) {
      return {
        success: false,
        reason: "invalid-restaurant",
      };
    }

    const isFavorite = state.favorites.some(
      (item) =>
        String(item?._id || item?.id || item) ===
        String(restaurantId)
    );

    if (isFavorite) {
      await removeFavorite(userId, restaurantId);

      dispatch({
        type: "REMOVE_FAVORITE",
        restaurantId,
      });

      return {
        success: true,
        isFavorite: false,
      };
    }

    await addFavorite(userId, restaurantId);

    dispatch({
      type: "ADD_FAVORITE",
      restaurantId,
      restaurant,
    });

    return {
      success: true,
      isFavorite: true,
    };
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = () => {
    clearAuthToken();
    dispatch({ type: "LOGOUT" });
  };

  // ============================================
  // SET USER
  // ============================================

  const setUser = (user) => {
    if (!user) {
      logout();
      return;
    }

    dispatch({
      type: "SET_USER",
      user,
    });
  };

  // ============================================
  // CONTEXT API
  // ============================================

  const api = useMemo(
    () => ({
      state,

      // Favorites
      loadFavorites,
      toggleFavorite,

      // Cart
      addToCart: (item) =>
        dispatch({
          type: "ADD_TO_CART",
          item,
          userRole: state.user?.role,
        }),

      removeFromCart: (item) =>
        dispatch({
          type: "REMOVE_FROM_CART",
          item,
          userRole: state.user?.role,
        }),

      clearCart: () =>
        dispatch({
          type: "CLEAR_CART",
        }),

      // User
      setUser,
      logout,

      // Orders
      setLastOrder: (order) =>
        dispatch({
          type: "SET_LAST_ORDER",
          order,
        }),

      reorder: (order) =>
        dispatch({
          type: "REORDER",
          order,
        }),

      // Cart helpers
      getCartList: () => Object.values(state.cartItems),

      getCartTotals: () => {
        const list = Object.values(state.cartItems);

        const subtotal = list.reduce(
          (sum, it) => sum + it.item.price * it.quantity,
          0
        );

        const delivery =
          subtotal > 0 && subtotal < 500 ? 30 : 0;

        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + delivery + tax;

        return {
          subtotal,
          delivery,
          tax,
          total,
        };
      },
    }),
    [state]
  );

  return (
    <AppContext.Provider value={api}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }

  return ctx;
}
