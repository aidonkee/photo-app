import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PhotoFormat } from '@/config/pricing';

export type CartItem = {
  photoId: string;
  photoUrl: string;
  photoAlt: string | null;
  format: PhotoFormat;
  quantity: number;
  pricePerUnit: number; 
  photoThumbnail?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item:  Omit<CartItem, 'pricePerUnit'> & { pricePerUnit?:  number }) => void;
  removeItem: (photoId: string, format: PhotoFormat) => void;
  updateQuantity: (photoId: string, format: PhotoFormat, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemKey: (photoId: string, format: PhotoFormat) => string;
};

const getItemKey = (photoId: string, format: PhotoFormat) => `${photoId}-${format}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const key = getItemKey(item.photoId, item.format);
        const existingItemIndex = get().items.findIndex(
          (i) => getItemKey(i.photoId, i.format) === key
        );

        // Price will be passed from PhotoModal (already calculated with school pricing)
        const pricePerUnit = item.pricePerUnit || 0;

        if (existingItemIndex >= 0) {
          set((state) => ({
            items: state.items.map((i, index) =>
              index === existingItemIndex
                ? { ... i, quantity: i.quantity + item.quantity }
                : i
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                ...item,
                pricePerUnit,
              },
            ],
          }));
        }
      },

      removeItem: (photoId, format) => {
        const key = getItemKey(photoId, format);
        set((state) => ({
          items: state. items.filter((i) => getItemKey(i.photoId, i.format) !== key),
        }));
      },

      updateQuantity: (photoId, format, quantity) => {
        if (quantity <= 0) {
          get().removeItem(photoId, format);
          return;
        }

        const key = getItemKey(photoId, format);
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i.photoId, i.format) === key ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.pricePerUnit * item. quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemKey,
    }),
    {
      name: 'school-photo-cart',
    }
  )
);