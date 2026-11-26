/**
 * Thin API client for the SAVORA backend.
 *
 * - Uses relative `/api` by default so Vite's dev proxy and a same-origin
 *   production deployment both work without CORS.
 * - Sends cookies (`credentials: "include"`) because sessions are httpOnly.
 * - Normalises the server's error envelope into a typed ApiError.
 * - Retries once through `/auth/refresh` when an access token has expired.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR", details, requestId } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return this.details.reduce((acc, detail) => {
      if (detail?.field) acc[detail.field] = detail.message;
      return acc;
    }, {});
  }
}

let refreshPromise = null;

async function refreshSession() {
  refreshPromise ||= fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      // Allow another refresh attempt on the next expiry.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    });

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, signal, retry = true } = options;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("We could not reach the restaurant server. Please try again.", {
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest(path, { ...options, retry: false });
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed (${response.status}).`, {
      status: response.status,
      code: payload?.error?.code || "REQUEST_FAILED",
      details: payload?.error?.details,
      requestId: payload?.requestId,
    });
  }

  return payload;
}

export const api = {
  request: apiRequest,

  /** Available dishes, newest first. Returns the standard envelope. */
  getMenu: ({ limit = 100, category, search, signal } = {}) => {
    const params = new URLSearchParams({ limit: String(limit), available: "true", sort: "newest" });
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    return apiRequest(`/menu?${params.toString()}`, { signal });
  },

  getMenuCategories: () => apiRequest("/menu/categories"),

  createReservation: (payload) =>
    apiRequest("/reservations", { method: "POST", body: payload }),

  getAvailability: (date) =>
    apiRequest(`/reservations/availability?date=${encodeURIComponent(date)}`),

  sendContactMessage: (payload) => apiRequest("/contact", { method: "POST", body: payload }),

  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),
  register: (details) => apiRequest("/auth/register", { method: "POST", body: details }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  currentUser: () => apiRequest("/auth/me"),
  /** Guest-safe probe: resolves with `{ data: { user: null } }` when signed out. */
  session: () => apiRequest("/auth/session"),

  getCart: (type = "pickup") => apiRequest(`/cart?type=${type}`),
  addToCart: (menuItemId, quantity = 1) =>
    apiRequest("/cart/items", { method: "POST", body: { menuItemId, quantity } }),
  updateCartItem: (menuItemId, quantity) =>
    apiRequest(`/cart/items/${menuItemId}`, { method: "PATCH", body: { quantity } }),
  removeCartItem: (menuItemId) =>
    apiRequest(`/cart/items/${menuItemId}`, { method: "DELETE" }),

  createOrder: (payload) => apiRequest("/orders", { method: "POST", body: payload }),
  myOrders: () => apiRequest("/orders?limit=20"),
  cancelOrder: (id) => apiRequest(`/orders/${id}/cancel`, { method: "POST", body: {} }),

  myReservations: () => apiRequest("/reservations/mine?limit=20"),
  cancelReservation: (id) =>
    apiRequest(`/reservations/${id}/cancel`, { method: "POST", body: {} }),

  /** Admin: the full card, including dishes marked unavailable. */
  getMenuAll: () => apiRequest("/menu?limit=100&sort=name"),
  setMenuAvailability: (id, isAvailable) =>
    apiRequest(`/menu/${id}/availability`, { method: "PATCH", body: { isAvailable } }),
  createMenuItem: (payload) => apiRequest("/menu", { method: "POST", body: payload }),
  updateMenuItem: (id, payload) => apiRequest(`/menu/${id}`, { method: "PATCH", body: payload }),
  deleteMenuItem: (id) => apiRequest(`/menu/${id}`, { method: "DELETE" }),

  admin: {
    stats: () => apiRequest("/admin/stats"),
    reservations: () => apiRequest("/admin/reservations?limit=50"),
    setReservationStatus: (id, status, note = "") =>
      apiRequest(`/admin/reservations/${id}/status`, { method: "PATCH", body: { status, note } }),
    orders: () => apiRequest("/admin/orders?limit=50"),
    setOrderStatus: (id, status, note = "") =>
      apiRequest(`/admin/orders/${id}/status`, { method: "PATCH", body: { status, note } }),
    messages: () => apiRequest("/admin/messages?limit=50"),
    setMessageStatus: (id, status) =>
      apiRequest(`/admin/messages/${id}`, { method: "PATCH", body: { status } }),
    customers: () => apiRequest("/admin/customers?limit=50"),
    setCustomerActive: (id, isActive) =>
      apiRequest(`/admin/customers/${id}`, { method: "PATCH", body: { isActive } }),
  },
};

export default api;
