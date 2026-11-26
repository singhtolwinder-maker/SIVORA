import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

const ShopContext = createContext(null);

const EMPTY_CART = {
  id: null,
  items: [],
  totals: {
    subtotalCents: 0,
    taxCents: 0,
    deliveryFeeCents: 0,
    totalCents: 0,
    itemCount: 0,
  },
};

/**
 * Owns the signed-in guest, their server-side cart and the two overlays.
 * The cart always lives in MongoDB; this is only a cache of the last response.
 */
export function ShopProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartType, setCartType] = useState("pickup");
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3600);
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .session()
      .then((payload) => {
        if (alive) setUser(payload?.data?.user ?? null);
      })
      .catch(() => {
        // No session is a normal state, not an error worth showing.
      })
      .finally(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const refreshCart = useCallback(async (type) => {
    try {
      const payload = await api.getCart(type);
      setCart(payload?.data ?? EMPTY_CART);
      return payload?.data ?? EMPTY_CART;
    } catch {
      setCart(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    api
      .getCart(cartType)
      .then((payload) => {
        if (alive) setCart(payload?.data ?? EMPTY_CART);
      })
      .catch(() => {
        if (alive) setCart(null);
      });
    return () => {
      alive = false;
    };
  }, [user, cartType]);

  const signIn = useCallback(async (credentials) => {
    const payload = await api.login(credentials);
    setUser(payload?.data?.user ?? null);
    return payload?.data?.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const payload = await api.register(details);
    setUser(payload?.data?.user ?? null);
    return payload?.data?.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setCart(null);
      setAccountOpen(false);
      setCartOpen(false);
    }
  }, []);

  const addItem = useCallback(
    async (menuItemId, quantity = 1) => {
      if (!user) {
        setCartOpen(true);
        return { needsAuth: true };
      }

      const payload = await api.addToCart(menuItemId, quantity);
      setCart(payload?.data ?? null);
      notify("Added to your order");
      return payload?.data;
    },
    [notify, user],
  );

  const setQuantity = useCallback(async (menuItemId, quantity) => {
    if (quantity < 1) {
      const payload = await api.removeCartItem(menuItemId);
      setCart(payload?.data ?? null);
      return;
    }
    const payload = await api.updateCartItem(menuItemId, quantity);
    setCart(payload?.data ?? null);
  }, []);

  const removeItem = useCallback(async (menuItemId) => {
    const payload = await api.removeCartItem(menuItemId);
    setCart(payload?.data ?? null);
  }, []);

  const placeOrder = useCallback(
    async (details) => {
      const payload = await api.createOrder({ ...details, type: cartType });
      setCart(EMPTY_CART);
      await refreshCart(cartType);
      return payload?.data;
    },
    [cartType, refreshCart],
  );

  const value = useMemo(
    () => ({
      user,
      checking,
      // Never expose a previous guest's cart after sign-out.
      cart: user ? cart : null,
      cartType,
      setCartType,
      cartOpen,
      accountOpen,
      toast,
      notify,
      refreshCart,
      addItem,
      setQuantity,
      removeItem,
      placeOrder,
      signIn,
      signUp,
      signOut,
      openCart: () => {
        setAccountOpen(false);
        setCartOpen(true);
      },
      closeCart: () => setCartOpen(false),
      openAccount: () => {
        setCartOpen(false);
        setAccountOpen(true);
      },
      closeAccount: () => setAccountOpen(false),
      itemCount: cart?.totals?.itemCount ?? 0,
    }),
    [
      user,
      checking,
      cart,
      cartType,
      // Overlay flags must be dependencies, otherwise opening a drawer never
      // reaches consumers that read them from this context value.
      cartOpen,
      accountOpen,
      toast,
      notify,
      refreshCart,
      addItem,
      setQuantity,
      removeItem,
      placeOrder,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside <ShopProvider>");
  return context;
}

export default ShopProvider;
