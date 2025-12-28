import { useState, useEffect, useCallback } from 'react';
import { Product, Order, OrderStatus, Role, Category, SystemConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, DEFAULT_CONFIG } from '../constants';

const STORAGE_KEYS = {
  PRODUCTS: 'app_products',
  ORDERS: 'app_orders',
  CATEGORIES: 'app_categories',
  CONFIG: 'app_config',
};

// Custom Event for Real-time Simulation across same-window components
const APP_UPDATE_EVENT = 'app_data_update';

export const useStore = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  // Initialize data
  useEffect(() => {
    const loadData = () => {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        setProducts(INITIAL_PRODUCTS);
      }

      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        setOrders([]);
      }

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
        setCategories(INITIAL_CATEGORIES);
      }

      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      } else {
         localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
         setConfig(DEFAULT_CONFIG);
      }
    };

    loadData();

    // Listen for custom events to simulate real-time updates
    const handleStorageChange = () => loadData();
    window.addEventListener(APP_UPDATE_EVENT, handleStorageChange);
    
    return () => {
      window.removeEventListener(APP_UPDATE_EVENT, handleStorageChange);
    };
  }, []);

  const dispatchUpdate = () => {
    window.dispatchEvent(new Event(APP_UPDATE_EVENT));
  };

  // --- Orders ---
  const addOrder = (order: Order) => {
    const newOrders = [order, ...orders];
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
    dispatchUpdate();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const newOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
    dispatchUpdate();
  };

  // NEW: Update full order details (for Admin)
  const updateOrder = (updatedOrder: Order) => {
    const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
    dispatchUpdate();
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const newOrders = orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED, cancelReason: reason } : o);
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
    dispatchUpdate();
  };

  // --- Products ---
  const addProduct = (product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    dispatchUpdate();
  };

  const updateProduct = (product: Product) => {
    const newProducts = products.map(p => p.id === product.id ? product : p);
    setProducts(newProducts);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    dispatchUpdate();
  };

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    dispatchUpdate();
  };

  // --- Categories ---
  const addCategory = (name: string) => {
    const newCategory: Category = { id: Math.random().toString(36).substr(2, 9), name };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    dispatchUpdate();
  };

  const updateCategory = (id: string, name: string) => {
    const newCategories = categories.map(c => c.id === id ? { ...c, name } : c);
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    dispatchUpdate();
  };

  const deleteCategory = (id: string) => {
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    dispatchUpdate();
  };

  // --- Config ---
  const updateConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    dispatchUpdate();
  };

  // Helper to format price in multi-currency
  const formatPrice = (usdPrice: number) => {
    const khr = Math.round(usdPrice * config.exchangeRateKHR / 100) * 100; // Round to nearest 100
    const vnd = Math.round(usdPrice * config.exchangeRateVND / 1000) * 1000; // Round to nearest 1000
    return {
      usd: `$${usdPrice.toFixed(2)}`,
      khr: `${khr.toLocaleString()}៛`,
      vnd: `${vnd.toLocaleString()}₫`,
      full: `$${usdPrice.toFixed(2)} / ${khr.toLocaleString()}៛ / ${vnd.toLocaleString()}₫`
    };
  };

  return {
    products,
    orders,
    categories,
    config,
    addOrder,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateConfig,
    formatPrice
  };
};