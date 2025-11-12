"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  ShoppingCart as CartIcon,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CartIndicator } from "@/components/cart-indicator";
import { AccountButton } from "@/components/account-button";
import {
  buildCartItemDetails,
  cartItemsSelector,
  useCartStore,
  type CartItemDetails,
} from "@/lib/cart-store";
import {
  getDefaultVariant,
  getPrimaryMedia,
  getProductBySlug,
  getProductVariant,
  products,
  type Product,
} from "@/data/products";
import { formatPaise } from "@/lib/money";
import { useServiceability } from "@/hooks/use-serviceability";

type DetailedCartItem = {
  key: string;
  qty: number;
  details: CartItemDetails;
};

function getVariantUnitPrice(details: CartItemDetails): number {
  return details.variant.salePaise ?? details.variant.mrpPaise;
}

function getVariantAvailableUnits(details: CartItemDetails): number {
  const stock = details.variant.stock;
  if (stock == null) {
    return 0;
  }
  return Math.max(0, stock);
}

const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/400x400.png?text=Fragrance";

export default function ShoppingCartPage() {
  const items = useCartStore(cartItemsSelector);
  const removeItem = useCartStore((state) => state.removeItem);
  const setItemQuantity = useCartStore((state) => state.setItemQuantity);
  const addItem = useCartStore((state) => state.addDetailedItem);
  const router = useRouter();

  const detailedItems = useMemo(() => {
    return items
      .map<DetailedCartItem | null>((cartItem) => {
        let details = cartItem.details ?? null;
        if (!details) {
          const product = getProductBySlug(cartItem.productSlug);
          if (!product) {
            return null;
          }
          const variant =
            getProductVariant(product.slug, cartItem.variantId) ??
            product.variants.find((entry) => entry.id === cartItem.variantId);
          if (!variant) {
            return null;
          }
          details = buildCartItemDetails(product, variant);
        }

        const available = getVariantAvailableUnits(details);
        const normalizedQty = Math.max(1, Math.round(cartItem.qty));
        const clampedQty =
          available > 0 ? Math.min(normalizedQty, available) : 0;

        if (clampedQty <= 0) {
          return null;
        }

        return {
          key: `${details.product.slug}-${details.variant.id}`,
          qty: clampedQty,
          details,
        };
      })
      .filter((item): item is DetailedCartItem => item !== null);
  }, [items]);

  useEffect(() => {
    for (const line of detailedItems) {
      const matching = items.find(
        (entry) =>
          entry.productSlug === line.details.product.slug &&
          entry.variantId === line.details.variant.id
      );
      if (!matching) {
        continue;
      }
      const normalizedOriginal = Math.max(1, Math.round(matching.qty));
      if (normalizedOriginal !== line.qty) {
        setItemQuantity(line.details.product.slug, line.details.variant.id, line.qty);
      }
    }
  }, [detailedItems, items, setItemQuantity]);

  const isEmpty = detailedItems.length === 0;

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discountPct: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [zip, setZip] = useState("");
  const [shippingRate, setShippingRate] = useState<number | null>(null);
  const [shippingEtaDays, setShippingEtaDays] = useState<number>(3);

  const FREE_SHIPPING_THRESHOLD = 15000;
  const DEFAULT_SHIPPING = 499;
  const TAX_RATE = 0.18;

  const rawSubtotal = useMemo(
    () =>
      detailedItems.reduce(
        (sum, item) => sum + getVariantUnitPrice(item.details) * item.qty,
        0
      ),
    [detailedItems]
  );
  const discount = promo
    ? Math.round(rawSubtotal * promo.discountPct * 100) / 100
    : 0;
  const taxableSubtotal = Math.max(0, rawSubtotal - discount);
  const tax = taxableSubtotal * TAX_RATE;
  const shipping =
    shippingRate ??
    (taxableSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : taxableSubtotal > 0
      ? DEFAULT_SHIPPING
      : 0);
  const total = taxableSubtotal + tax + shipping;

  const etaDate = useMemo(() => {
    const baseDays = shippingEtaDays > 0 ? shippingEtaDays : 3;
    const eta = new Date();
    eta.setDate(eta.getDate() + baseDays);
    return eta.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [shippingEtaDays]);

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === "SWC10") {
      setPromo({ code, discountPct: 0.1 });
      setPromoError(null);
    } else if (code === "ROSE15") {
      setPromo({ code, discountPct: 0.15 });
      setPromoError(null);
    } else {
      setPromo(null);
      setPromoError("Code not valid");
    }
  }, [promoInput]);

  const removePromo = useCallback(() => {
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
  }, []);

  const cartWeightEstimate = useMemo(() => {
    const total = detailedItems.reduce((sum, item) => {
      const size = item.details.variant.sizeMl;
      const perUnit = Number.isFinite(size) && size > 0 ? Number(size) : 250;
      return sum + Math.max(250, Math.round(perUnit * 1.1)) * item.qty;
    }, 0);
    return Math.max(500, total || 0);
  }, [detailedItems]);

  const {
    serviceability,
    serviceabilityError,
    isCheckingServiceability,
    checkServiceability,
  } = useServiceability(zip, {
    declaredValuePaise: Math.round(rawSubtotal),
    weightGrams: cartWeightEstimate,
  });

  const zipDisplay = useMemo(
    () => (zip.trim() || "this PIN"),
    [zip]
  );

  const calcShipping = useCallback(() => {
    const subtotal = taxableSubtotal;
    if (subtotal <= 0) {
      setShippingRate(0);
      setShippingEtaDays(0);
      return;
    }
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      setShippingRate(0);
      setShippingEtaDays(2);
      return;
    }
    const isValidPin = /^\d{6}$/;
    const near = isValidPin.test(zip) ? Number.parseInt(zip[0], 10) <= 4 : false;
    setShippingRate(near ? 299 : 599);
    setShippingEtaDays(near ? 3 : 5);
  }, [taxableSubtotal, zip, FREE_SHIPPING_THRESHOLD]);

  function updateQty(
    slug: string,
    variantId: string,
    details: CartItemDetails,
    next: number
  ) {
    const available = getVariantAvailableUnits(details);
    const max = Math.max(0, available);
    const clamped =
      max <= 0 ? 0 : Math.max(1, Math.min(Math.round(next), max));
    setItemQuantity(slug, variantId, clamped);
  }

  function handleRemove(details: CartItemDetails) {
    removeItem(details.product.slug, details.variant.id);
  }

  function handleRecommendedAdd(product: Product) {
    const variant = getDefaultVariant(product.slug);
    if (!variant) {
      return;
    }
    addItem(product, variant, 1);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
            <div className="flex items-center gap-2 text-gray-700">
              <CartIcon className="h-5 w-5" />
              <span className="font-semibold">Shopping Cart</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <Card className="rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-xl">
                  Your items
                </h1>
                {!isEmpty && (
                  <span className="text-sm text-gray-500">
                    {detailedItems.length}{" "}
                    {detailedItems.length > 1 ? "items" : "item"}
                  </span>
                )}
              </div>

              {isEmpty ? (
                <div className="py-12 text-center text-gray-600">
                  Your cart is empty.{" "}
                  <Link
                    href="/"
                    className="font-medium text-pink-600 hover:text-pink-700"
                  >
                    Browse perfumes
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailedItems.map(({ key, details, qty }) => {
                    const stockLimit = getVariantAvailableUnits(details);
                    const limitReached =
                      Number.isFinite(stockLimit) && stockLimit > 0 && qty >= stockLimit;
                    const variantLabel = `${details.variant.sizeMl} ml`;
                    const lineUnitPrice = getVariantUnitPrice(details);
                    const lineTotal = lineUnitPrice * qty;
                    const lineTotalLabel = formatPaise(lineTotal, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    });
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={details.product.imageUrl ?? FALLBACK_IMAGE_URL}
                            alt={details.product.imageAlt ?? details.product.title}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {details.product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {variantLabel}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-3 rounded-full border px-3 py-1.5">
                            <button
                              aria-label={`Decrease ${details.product.title}`}
                              onClick={() =>
                                updateQty(
                                  details.product.slug,
                                  details.variant.id,
                                  details,
                                  qty - 1
                                )
                              }
                              disabled={qty <= 1}
                              className="disabled:opacity-40"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <Input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(event) =>
                                updateQty(
                                  details.product.slug,
                                  details.variant.id,
                                  details,
                                  Number.parseInt(event.target.value, 10) || 1
                                )
                              }
                              className="h-7 w-12 border-0 bg-transparent p-0 text-center focus-visible:ring-0"
                            />
                            <button
                              aria-label={`Increase ${details.product.title}`}
                              onClick={() =>
                                updateQty(
                                  details.product.slug,
                                  details.variant.id,
                                  details,
                                  qty + 1
                                )
                              }
                              disabled={limitReached}
                              className="disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {limitReached && (
                            <div className="mt-1 text-xs text-amber-600">
                              Max available reached
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {lineTotalLabel}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 gap-1 text-gray-500 hover:text-rose-600"
                            onClick={() => handleRemove(details)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">You might also like</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.slice(0, 4).map((product) => {
                const media = getPrimaryMedia(product);
                const priceLabel = formatPaise(product.aggregates.lowPricePaise, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                });
                return (
                  <Card
                    key={product.id}
                    className="rounded-xl transition hover:shadow-md"
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={media?.url ?? FALLBACK_IMAGE_URL}
                          alt={media?.alt ?? product.title}
                          width={320}
                          height={320}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium">{product.title}</div>
                        <div className="font-semibold text-pink-600">
                          {priceLabel}
                        </div>
                      </div>
                      <Button
                        className="mt-2 w-full bg-pink-600 hover:bg-pink-700"
                        onClick={() => handleRecommendedAdd(product)}
                      >
                        Add
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="lg:col-span-4">
          <Card className="rounded-2xl lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Promo code</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={promoInput}
                    onChange={(event) => {
                      setPromoInput(event.target.value);
                      setPromoError(null);
                    }}
                  />
                  <Button variant="outline" onClick={applyPromo}>
                    Apply
                  </Button>
                </div>
                {promo ? (
                  <div className="mt-2 text-sm text-emerald-700">
                    Applied{" "}
                    <Badge className="ml-1 border-0 bg-emerald-100 text-emerald-700">
                      {promo.code}
                    </Badge>
                    <button
                      className="ml-2 underline"
                      onClick={removePromo}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  promoError && (
                    <div className="mt-2 text-sm text-rose-600">
                      {promoError}
                    </div>
                  )
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Shipping</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="ZIP / PIN code"
                    value={zip}
                    maxLength={6}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 6);
                      setZip(digitsOnly);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      calcShipping();
                      void checkServiceability();
                    }}
                    disabled={isCheckingServiceability}
                  >
                    {isCheckingServiceability ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Calculate
                  </Button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {shippingRate === null ? (
                    <>
                      Estimated delivery by{" "}
                      <span className="font-medium">{etaDate}</span>
                    </>
                  ) : (
                    <>
                      Rate:{" "}
                  {shippingRate === 0
                    ? "Free"
                    : formatPaise(shippingRate, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      • ETA{" "}
                      <span className="font-medium">{etaDate}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs">
                  {serviceabilityError ? (
                    <p className="text-rose-600">{serviceabilityError}</p>
                  ) : serviceability ? (
                    <div
                      className={`rounded-lg border p-3 ${
                        serviceability.isServiceable
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-600"
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        {serviceability.isServiceable
                          ? `Delivery available to ${zipDisplay}`
                          : `Not deliverable to ${zipDisplay}`}
                      </p>
                      {serviceability.isServiceable ? (
                        <p className="mt-1 text-current">
                          Prepaid: <span className="font-semibold">Yes</span> • COD:{" "}
                          <span className="font-semibold">
                            {serviceability.codAvailable ? "Available" : "Not available"}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-current">
                          Try another pincode or contact support for help.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Enter your PIN to confirm delivery options and COD availability.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPaise(rawSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>- {formatPaise(discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0
                      ? "Free"
                      : formatPaise(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>{formatPaise(tax)}</span>
                </div>
                <div className="mt-1 flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPaise(total)}</span>
                </div>
              </div>

              <Button
                className="flex w-full items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700"
                disabled={isEmpty}
                onClick={() => router.push("/checkout")}
              >
                Proceed to checkout <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-center text-xs text-gray-500">
                You can checkout as a guest. We’ll save your cart for 7 days.
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
