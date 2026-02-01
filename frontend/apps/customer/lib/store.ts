import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItem, SelectedModifier } from '@/types';

interface CartState {
  items: CartItem[];
  geoToken: string | null;
  geoTokenExpiry: string | null;
  addItem: (item: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  setGeoToken: (token: string, expiry: string) => void;
  clearGeoToken: () => void;
  isGeoTokenValid: () => boolean;
  getSubtotalCents: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      geoToken: null,
      geoTokenExpiry: null,

      addItem: (menuItem, quantity, modifiers, specialInstructions) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.menuItem.id === menuItem.id &&
              JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }

          return {
            items: [
              ...state.items,
              { menuItem, quantity, modifiers, specialInstructions },
            ],
          };
        });
      },

      updateItemQuantity: (index, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((_, i) => i !== index) };
          }
          const newItems = [...state.items];
          newItems[index].quantity = quantity;
          return { items: newItems };
        });
      },

      removeItem: (index) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setGeoToken: (token, expiry) => {
        set({ geoToken: token, geoTokenExpiry: expiry });
      },

      clearGeoToken: () => {
        set({ geoToken: null, geoTokenExpiry: null });
      },

      isGeoTokenValid: () => {
        const { geoToken, geoTokenExpiry } = get();
        if (!geoToken || !geoTokenExpiry) return false;
        return new Date(geoTokenExpiry) > new Date();
      },

      getSubtotalCents: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.menuItem.price_cents;
          const modifiersPrice = item.modifiers.reduce(
            (sum, mod) => sum + mod.price_delta_cents,
            0
          );
          return total + (itemPrice + modifiersPrice) * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'roms-cart',
      partialize: (state) => ({
        items: state.items,
        geoToken: state.geoToken,
        geoTokenExpiry: state.geoTokenExpiry,
      }),
    }
  )
);
