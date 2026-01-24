import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface CartItem {
  id: string;
  type: 'product' | 'service';
  item_id: string;
  name: string;
  price: number;
  discount_percent: number;
  quantity: number;
  image?: string;
  // Service specific
  duration?: number;
  master_name?: string;
  date_time?: string;
}

interface CartState {
  items: CartItem[];
  userId: string | null;
  loading: boolean;
  
  setUserId: (userId: string | null) => void;
  loadCart: (userId: string) => Promise<void>;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  userId: null,
  loading: false,

  setUserId: (userId) => {
    set({ userId, items: [] });
    if (userId) {
      get().loadCart(userId);
    }
  },

  loadCart: async (userId: string) => {
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/api/cart/${userId}`);
      set({ items: response.data.items || [], loading: false });
    } catch (error) {
      console.error('Failed to load cart:', error);
      set({ items: [], loading: false });
    }
  },

  addItem: async (item) => {
    const { userId } = get();
    if (!userId) {
      console.error('No user ID set');
      return;
    }

    try {
      const cartItem = {
        type: item.type,
        item_id: item.item_id,
        name: item.name,
        price: item.price,
        discount_percent: item.discount_percent,
        quantity: item.quantity,
        image: item.image,
        duration: item.duration,
        master_name: item.master_name,
        date_time: item.date_time,
      };

      await axios.post(`${API_URL}/api/cart/${userId}/items`, cartItem);
      
      // Reload cart from server
      await get().loadCart(userId);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  },

  removeItem: async (itemId: string) => {
    const { userId } = get();
    if (!userId) return;

    try {
      await axios.delete(`${API_URL}/api/cart/${userId}/items/${itemId}`);
      
      // Update local state immediately
      set({ items: get().items.filter((i) => i.id !== itemId) });
    } catch (error) {
      console.error('Failed to remove item:', error);
      // Reload from server on error
      await get().loadCart(userId);
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const { userId } = get();
    if (!userId) return;

    try {
      if (quantity <= 0) {
        await get().removeItem(itemId);
        return;
      }

      await axios.put(`${API_URL}/api/cart/${userId}/items/${itemId}?quantity=${quantity}`);
      
      // Update local state immediately
      const items = get().items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      set({ items });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Reload from server on error
      await get().loadCart(userId);
    }
  },

  clearCart: async () => {
    const { userId } = get();
    if (!userId) return;

    try {
      await axios.delete(`${API_URL}/api/cart/${userId}`);
      set({ items: [] });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  getTotal: () => {
    return get().items.reduce((total, item) => {
      const discountedPrice = item.price - (item.price * item.discount_percent) / 100;
      return total + discountedPrice * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
