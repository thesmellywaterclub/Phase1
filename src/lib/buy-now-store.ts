"use client";

import { create } from "zustand";

import type { CartItemDetails } from "@/lib/cart-store";

export type BuyNowItem = {
  details: CartItemDetails;
  qty: number;
};

type BuyNowState = {
  item: BuyNowItem | null;
  setItem: (item: BuyNowItem) => void;
  clear: () => void;
};

export const useBuyNowStore = create<BuyNowState>((set) => ({
  item: null,
  setItem: (item) => set({ item }),
  clear: () => set({ item: null }),
}));
