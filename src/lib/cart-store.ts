"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { getProductBySlug, getProductVariant } from "@/data/products";

type CartItem = {
  productSlug: string;
  variantId: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  addItem: (productSlug: string, variantId: string, qty?: number) => void;
  setItemQuantity: (
    productSlug: string,
    variantId: string,
    qty: number
  ) => void;
  removeItem: (productSlug: string, variantId: string) => void;
  clear: () => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
} as Storage;

function clampQuantity(
  productSlug: string,
  variantId: string,
  qty: number
): number {
  const variant = getProductVariant(productSlug, variantId);
  const max = variant?.stock ?? Number.POSITIVE_INFINITY;
  if (max <= 0) {
    return 0;
  }
  const clamped = Math.max(1, Math.min(max, Math.round(qty)));
  return Number.isFinite(clamped) ? clamped : 1;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productSlug, variantId, qty = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productSlug === productSlug && item.variantId === variantId
          );
          const clamped = clampQuantity(productSlug, variantId, qty);
          if (clamped === 0) {
            return state;
          }
          if (existing) {
            const nextQty = clampQuantity(
              productSlug,
              variantId,
              existing.qty + clamped
            );
            return {
              items: state.items.map((item) =>
                item === existing ? { ...item, qty: nextQty } : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { productSlug, variantId, qty: clamped },
            ],
          };
        }),
      setItemQuantity: (productSlug, variantId, qty) =>
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productSlug === productSlug && item.variantId === variantId
          );
          if (!existing) return state;
          const clamped = clampQuantity(productSlug, variantId, qty);
          if (clamped <= 0) {
            return {
              items: state.items.filter((item) => item !== existing),
            };
          }
          return {
            items: state.items.map((item) =>
              item === existing ? { ...item, qty: clamped } : item
            ),
          };
        }),
      removeItem: (productSlug, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productSlug === productSlug &&
                item.variantId === variantId
              )
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "veloura-cart",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage
      ),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

export const cartItemsSelector = (state: CartState) => state.items;
export const cartCountSelector = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.qty, 0);
