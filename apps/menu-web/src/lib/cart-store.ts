'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItemOption {
  id: string;
  name: string;
  price_delta: string;
}

export interface CartItem {
  /** UUID local do item no carrinho — permite duas linhas do mesmo produto com adicionais diferentes. */
  line_id: string;
  product_id: string;
  product_name: string;
  product_price: string;
  image_url: string | null;
  quantity: number;
  notes: string | null;
  options: CartItemOption[];
}

interface CartState {
  slug: string | null;
  items: CartItem[];
  addItem: (slug: string, item: Omit<CartItem, 'line_id'>) => void;
  updateQuantity: (line_id: string, quantity: number) => void;
  removeItem: (line_id: string) => void;
  clear: () => void;
}

function genLineId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      slug: null,
      items: [],
      addItem: (slug, item) =>
        set((state) => {
          // Se o carrinho é de outro restaurante, limpa.
          if (state.slug && state.slug !== slug) {
            return {
              slug,
              items: [{ ...item, line_id: genLineId() }],
            };
          }
          return {
            slug,
            items: [...state.items, { ...item, line_id: genLineId() }],
          };
        }),
      updateQuantity: (line_id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.line_id === line_id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      removeItem: (line_id) =>
        set((state) => ({
          items: state.items.filter((i) => i.line_id !== line_id),
        })),
      clear: () => set({ slug: null, items: [] }),
    }),
    {
      name: 'menvi-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Calcula preço unitário incluindo adicionais. */
export function lineUnitPrice(item: CartItem): number {
  const base = Number.parseFloat(item.product_price);
  const opts = item.options.reduce((acc, o) => acc + Number.parseFloat(o.price_delta), 0);
  return base + opts;
}

export function lineTotal(item: CartItem): number {
  return lineUnitPrice(item) * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + lineTotal(i), 0);
}
