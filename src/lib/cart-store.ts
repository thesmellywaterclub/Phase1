"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  getPrimaryMedia,
  getProductBySlug,
  getProductVariant,
} from "@/data/products";
import type { Product, ProductVariant } from "@/data/products";

type CartProductSnapshot = {
  slug: string;
  title: string;
  brandName: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

type CartVariantSnapshot = {
  id: string;
  sku: string;
  sizeMl: number;
  mrpPaise: number;
  salePaise: number | null;
  stock: number | null;
  reserved: number | null;
};

export type CartItemDetails = {
  product: CartProductSnapshot;
  variant: CartVariantSnapshot;
};

type CartItem = {
  productSlug: string;
  variantId: string;
  qty: number;
  details?: CartItemDetails;
};

type CartState = {
  items: CartItem[];
  addItem: (productSlug: string, variantId: string, qty?: number) => void;
  addDetailedItem: (
    product: Product,
    variant: ProductVariant,
    qty?: number
  ) => void;
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

export function buildCartItemDetails(
  product: Product,
  variant: ProductVariant
): CartItemDetails {
  const media = getPrimaryMedia(product);
  const mediaUrl = typeof media?.url === "string" ? media.url.trim() : "";
  const mediaAlt = typeof media?.alt === "string" ? media.alt.trim() : "";
  const effectiveSalePaise =
    variant.bestOffer?.price ?? variant.salePaise ?? null;
  const effectiveStock =
    variant.inventory?.stock ??
    (typeof variant.bestOffer?.stockQty === "number"
      ? variant.bestOffer.stockQty
      : null);
  return {
    product: {
      slug: product.slug,
      title: product.title,
      brandName: product.brand.name,
      imageUrl: mediaUrl || null,
      imageAlt: mediaAlt || product.title,
    },
    variant: {
      id: variant.id,
      sku: variant.sku,
      sizeMl: variant.sizeMl,
      mrpPaise: variant.mrpPaise,
      salePaise: effectiveSalePaise,
      stock: effectiveStock,
      reserved: variant.inventory?.reserved ?? null,
    },
  };
}

function snapshotFromCatalog(
  productSlug: string,
  variantId: string
): CartItemDetails | null {
  const product = getProductBySlug(productSlug);
  if (!product) return null;
  const variant = product.variants.find((entry) => entry.id === variantId);
  if (!variant) return null;
  return buildCartItemDetails(product, variant);
}

function clampQuantity(qty: number, snapshot: CartItemDetails | null): number {
  if (!Number.isFinite(qty)) {
    return 0;
  }
  const normalized = Math.round(qty);
  if (normalized <= 0) {
    return 0;
  }
  const stock = snapshot?.variant.stock;
  if (typeof stock === "number") {
    const reserved = snapshot?.variant.reserved ?? 0;
    const max = Math.max(0, stock - reserved);
    if (max <= 0) {
      return 0;
    }
    return Math.min(normalized, max);
  }
  return normalized;
}

function appendOrUpdateItem(
  items: CartItem[],
  productSlug: string,
  variantId: string,
  qty: number,
  details?: CartItemDetails | null
): CartItem[] {
  if (qty <= 0) {
    return items;
  }

  const existing = items.find(
    (item) =>
      item.productSlug === productSlug && item.variantId === variantId
  );

  const snapshot =
    details ??
    existing?.details ??
    snapshotFromCatalog(productSlug, variantId);

  if (!snapshot) {
    return existing
      ? items.filter((item) => item !== existing)
      : items;
  }

  if (existing) {
    const nextQty = clampQuantity(existing.qty + qty, snapshot);
    if (nextQty <= 0) {
      return items.filter((item) => item !== existing);
    }
    return items.map((item) =>
      item === existing ? { ...item, qty: nextQty, details: snapshot } : item
    );
  }

  const initialQty = clampQuantity(qty, snapshot);
  if (initialQty <= 0) {
    return items;
  }

  return [
    ...items,
    {
      productSlug,
      variantId,
      qty: initialQty,
      details: snapshot,
    },
  ];
}

function setItemQty(
  items: CartItem[],
  productSlug: string,
  variantId: string,
  qty: number
): CartItem[] {
  const existing = items.find(
    (item) =>
      item.productSlug === productSlug && item.variantId === variantId
  );
  if (!existing) {
    return items;
  }

  const snapshot =
    existing.details ?? snapshotFromCatalog(productSlug, variantId);

  if (!snapshot) {
    return items.filter((item) => item !== existing);
  }

  const clamped = clampQuantity(qty, snapshot);
  if (clamped <= 0) {
    return items.filter((item) => item !== existing);
  }

  if (clamped === existing.qty && existing.details === snapshot) {
    return items;
  }

  return items.map((item) =>
    item === existing ? { ...item, qty: clamped, details: snapshot } : item
  );
}

function sanitizeItems(items: CartItem[]): CartItem[] {
  return items
    .map((item) => {
      const snapshot =
        item.details ?? snapshotFromCatalog(item.productSlug, item.variantId);
      if (!snapshot) {
        return null;
      }
      const quantity = clampQuantity(item.qty, snapshot);
      if (quantity <= 0) {
        return null;
      }
      return {
        productSlug: item.productSlug,
        variantId: item.variantId,
        qty: quantity,
        details: snapshot,
      } satisfies CartItem;
    })
    .filter((entry): entry is CartItem => entry !== null);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productSlug, variantId, qty = 1) =>
        set((state) => ({
          items: appendOrUpdateItem(state.items, productSlug, variantId, qty),
        })),
      addDetailedItem: (product, variant, qty = 1) =>
        set((state) => ({
          items: appendOrUpdateItem(
            state.items,
            product.slug,
            variant.id,
            qty,
            buildCartItemDetails(product, variant)
          ),
        })),
      setItemQuantity: (productSlug, variantId, qty) =>
        set((state) => ({
          items: setItemQty(state.items, productSlug, variantId, qty),
        })),
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.items = sanitizeItems(state.items);
      },
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

export const cartItemsSelector = (state: CartState) => state.items;
export const cartCountSelector = (state: CartState) =>
  state.items.reduce((sum, item) => {
    const snapshot =
      item.details ?? snapshotFromCatalog(item.productSlug, item.variantId);
    if (!snapshot) {
      return sum;
    }
    return sum + Math.max(0, Math.round(item.qty));
  }, 0);
