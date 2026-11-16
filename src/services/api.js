const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const TOKEN_KEY = "apnamaal_token";

// Save JWT token after login/register
function saveAuthToken(data) {
  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
}

// Clear token during logout
export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem(TOKEN_KEY);

    console.log("API Call:", url, options.method || "GET");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Network error",
      }));

      console.error(
        "API Error Response:",
        errorData,
        "Status:",
        response.status,
      );

      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`,
      );
    }

    if (response.status === 204) return null;

    return await response.json();
  } catch (error) {
    console.error("API Error:", endpoint, error.message);

    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network")
    ) {
      throw new Error(
        "Cannot connect to server. Please check if backend is running.",
      );
    }

    throw error;
  }
}
// Restaurants API

export async function fetchRestaurants({
  query = "",
  cuisine = "",
  page = 1,
  limit = 12,
  sort = "",
  source = "",
} = {}) {
  const params = new URLSearchParams();

  if (query) params.append("query", query);
  if (cuisine) params.append("cuisine", cuisine);
  if (sort && sort !== "relevance") params.append("sort", sort);

  params.append("page", page);
  params.append("limit", limit);

  if (source) params.append("source", source);

  return await apiCall(`/restaurants?${params.toString()}`);
}

export async function fetchRestaurantById(id) {
  return await apiCall(`/restaurants/${id}`);
}

export async function fetchMenuByRestaurantId(id, veg = undefined) {
  const params = new URLSearchParams();
  if (veg !== undefined) params.append("veg", veg);

  const queryString = params.toString();
  const endpoint = `/restaurants/${id}/menu${queryString ? "?" + queryString : ""}`;

  return await apiCall(endpoint);
}

// Owner/Restaurant Management
export async function fetchOwnerRestaurants(ownerId) {
  return await apiCall(`/restaurants/owner/${ownerId}/list`);
}

export async function createRestaurantForOwner(ownerId, data) {
  return await apiCall(`/restaurants/owner/${ownerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRestaurant(id, data) {
  return await apiCall(`/restaurants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function setRestaurantOffer(id, { offer, ownerId }) {
  return await apiCall(`/restaurants/${id}/offer`, {
    method: "PATCH",
    body: JSON.stringify({ offer, ownerId }),
  });
}

export async function addMenuItem(restaurantId, item, ownerId) {
  return await apiCall(`/restaurants/${restaurantId}/menu`, {
    method: "POST",
    body: JSON.stringify({ ...item, ownerId }),
  });
}

export async function updateMenuItem(restaurantId, itemId, updates, ownerId) {
  return await apiCall(`/restaurants/${restaurantId}/menu/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ ...updates, ownerId }),
  });
}

export async function deleteMenuItem(restaurantId, itemId, ownerId) {
  const qs = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
  return await apiCall(`/restaurants/${restaurantId}/menu/${itemId}${qs}`, {
    method: "DELETE",
  });
}

// Orders API
export async function placeOrder({
  userId,
  restaurantId,
  items,
  address,
  paymentMethod,
  scheduled,
  scheduleDate,
  scheduleTime,
  couponCode,
}) {
  return await apiCall("/orders/checkout", {
    method: "POST",
    body: JSON.stringify({
      userId,
      restaurantId,
      items: items.map(({ item, quantity }) => ({
        item: item.id || item._id,
        name: item.name,
        price: item.price,
        quantity,
      })),
      address,
      paymentMethod,
      scheduled: scheduled || false,
      scheduledDate: scheduleDate || null,
      scheduledTime: scheduleTime || null,
      couponCode: couponCode || null,
    }),
  });
}

export async function fetchOrderById(orderId) {
  return await apiCall(`/orders/${orderId}`);
}

export async function fetchUserOrders(userId) {
  return await apiCall(`/orders/user/${userId}`);
}

export async function fetchRestaurantOrders(restaurantId) {
  return await apiCall(`/orders/restaurant/${restaurantId}`);
}

// Owner accepts or rejects an order
export async function respondToOwnerOrder(orderId, action, reason = "") {
  return await apiCall(`/orders/${orderId}/owner-response`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

// Owner assigns delivery partner
export async function assignDeliveryPartner(orderId, deliveryBoyId) {
  return await apiCall(`/orders/${orderId}/assign-delivery`, {
    method: "POST",
    body: JSON.stringify({ deliveryBoyId }),
  });
}

export async function pollOrderStatus(orderId) {
  return await apiCall(`/orders/${orderId}/status`);
}

export async function updateOrderStatus(orderId, status, deliveryBoyId = null) {
  return await apiCall(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, deliveryBoyId }),
  });
}

// Users API
export async function registerUser({ name, email, phone, password }) {
  const result = await apiCall("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password }),
  });

  saveAuthToken(result);
  return result;
}

export async function loginUser({ email, phone, password }) {
  const result = await apiCall("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, phone, password }),
  });

  saveAuthToken(result);
  return result;
}

export async function fetchUserById(userId) {
  return await apiCall("/users/me");
}

export async function addAddress(userId, address) {
  return await apiCall(`/users/${userId}/addresses`, {
    method: "POST",
    body: JSON.stringify(address),
  });
}

// Fetch all saved addresses
export async function fetchAddresses(userId) {
  return await apiCall(`/users/${userId}/addresses`);
}

// Update an existing address
export async function updateAddress(userId, addressId, address) {
  return await apiCall(`/users/${userId}/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

// Set an address as default
export async function setDefaultAddress(userId, addressId) {
  return await apiCall(`/users/${userId}/addresses/${addressId}/default`, {
    method: "PATCH",
  });
}

// Delete an address
export async function deleteAddress(userId, addressId) {
  return await apiCall(`/users/${userId}/addresses/${addressId}`, {
    method: "DELETE",
  });
}

// Register Delivery Boy
// Register Delivery Boy
export async function registerDeliveryBoy(data) {
  const result = await apiCall("/users/register-delivery", {
    method: "POST",
    body: JSON.stringify(data),
  });

  saveAuthToken(result);
  return result;
}

// Register Restaurant Owner
export async function registerRestaurantOwner(data) {
  const result = await apiCall("/users/register-restaurant-owner", {
    method: "POST",
    body: JSON.stringify(data),
  });

  saveAuthToken(result);
  return result;
}
// Delivery API
export async function fetchDeliveryBoys() {
  return await apiCall("/delivery");
}

export async function fetchDeliveryBoyById(id) {
  return await apiCall(`/delivery/${id}`);
}

export async function updateDeliveryBoyLocation(id, latitude, longitude) {
  return await apiCall(`/delivery/${id}/location`, {
    method: "PATCH",
    body: JSON.stringify({ latitude, longitude }),
  });
}

// Health check
export async function checkHealth() {
  return await apiCall("/health");
}

// -------------------- COUPON API --------------------

export async function validateCoupon(code, subtotal) {
  return await apiCall("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function fetchAdminCoupons() {
  return await apiCall("/coupons");
}

export async function createCoupon(data) {
  return await apiCall("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCoupon(id, data) {
  return await apiCall(`/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCoupon(id) {
  return await apiCall(`/coupons/${id}`, {
    method: "DELETE",
  });
}

// -------------------- ORDER CANCELLATION --------------------

export async function cancelOrder(orderId, reason = "") {
  return await apiCall(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function updateRefundStatus(orderId, status, failureReason = "") {
  return await apiCall(`/orders/${orderId}/refund`, {
    method: "PATCH",
    body: JSON.stringify({ status, failureReason }),
  });
}

// -------------------- NOTIFICATION API --------------------

export async function fetchNotifications() {
  return await apiCall("/notifications");
}

export async function markNotificationRead(id) {
  return await apiCall(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return await apiCall("/notifications/read-all", {
    method: "PATCH",
  });
}

// -------------------- ANALYTICS API --------------------

export async function fetchAdminAnalytics() {
  return await apiCall("/admin/analytics");
}

// -------------------- RESTAURANT SALES API --------------------

export async function fetchRestaurantSummary(restaurantId) {
  return await apiCall(`/orders/restaurant/${restaurantId}/summary`);
}

// ============================================
// FAVORITES / WISHLIST APIs
// ============================================

export async function fetchFavorites(userId) {
  return await apiCall(`/users/${userId}/favorites`);
}

export async function addFavorite(userId, restaurantId) {
  return await apiCall(`/users/${userId}/favorites`, {
    method: "POST",
    body: JSON.stringify({ restaurantId }),
  });
}

export async function removeFavorite(userId, restaurantId) {
  return await apiCall(`/users/${userId}/favorites/${restaurantId}`, {
    method: "DELETE",
  });
}
