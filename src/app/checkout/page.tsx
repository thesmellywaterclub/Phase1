"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Lock,
  QrCode,
  Package,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Info,
  MapPin,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CartIndicator } from "@/components/cart-indicator";
import { AccountButton } from "@/components/account-button";
import {
  buildCartItemDetails,
  cartItemsSelector,
  useCartStore,
} from "@/lib/cart-store";
import type { CartItemDetails } from "@/lib/cart-store";
import { useBuyNowStore } from "@/lib/buy-now-store";
import {
  submitBuyNowCheckout,
  submitCartCheckout,
  type CheckoutAddressInput,
  type CheckoutOrder,
} from "@/data/checkout";
import { createRazorpaySession, confirmRazorpayPayment } from "@/data/payments";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import { syncRemoteCart } from "@/lib/cart-remote";
import { getProductBySlug, getProductVariant } from "@/data/products";
import { formatPaise } from "@/lib/money";
import {
  createShipmentsForOrder,
  type ServiceabilityResult,
} from "@/data/shipments";
import { useServiceability } from "@/hooks/use-serviceability";

type DetailedItem = {
  key: string;
  qty: number;
  details: CartItemDetails;
  unitPricePaise: number;
};

function getUnitPricePaise(details: CartItemDetails): number {
  return details.variant.salePaise ?? details.variant.mrpPaise;
}

function getAvailableUnits(details: CartItemDetails): number {
  const stock = details.variant.stock;
  if (stock == null) {
    return 0;
  }
  return Math.max(0, stock);
}

function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEstimatedDelivery(result: ServiceabilityResult): string | null {
  if (result.estimatedDeliveryDate) {
    try {
      const date = new Date(result.estimatedDeliveryDate);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("en-IN", {
          month: "short",
          day: "numeric",
        }).format(date);
      }
    } catch {
      // ignore invalid date
    }
  }

  if (
    typeof result.estimatedDeliveryDays === "number" &&
    Number.isFinite(result.estimatedDeliveryDays)
  ) {
    const rounded = Math.max(1, Math.round(result.estimatedDeliveryDays));
    return `in ${rounded} ${rounded === 1 ? "day" : "days"}`;
  }

  return null;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Guest", lastName: "Customer" };
  }
  const [firstName, ...rest] = parts;
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : firstName,
  };
}

function createCheckoutAddressFromShipping(
  shipping: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }
): CheckoutAddressInput {
  const { firstName, lastName } = splitName(shipping.name);
  const line1 = shipping.line1.trim();
  const line2 = shipping.line2.trim();
  return {
    firstName,
    lastName,
    line1,
    line2: line2 ? line2 : undefined,
    city: shipping.city.trim(),
    state: shipping.state.trim(),
    postalCode: shipping.zip.trim(),
    country: shipping.country.trim(),
    phone: shipping.phone.trim() || undefined,
  };
}

const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/400x400.png?text=Fragrance";

const INDIAN_STATE_NAMES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const INDIAN_STATE_CODE_MAP: Record<string, string> = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  CT: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  OR: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  UA: "Uttarakhand",
  WB: "West Bengal",
  AN: "Andaman and Nicobar Islands",
  CH: "Chandigarh",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry",
};

const INDIA_COUNTRY_LABELS = new Set([
  "india",
  "bharat",
  "republic of india",
  "in",
]);

function normalizeStateInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

const INDIAN_STATE_LOOKUP = (() => {
  const map = new Map<string, string>();
  INDIAN_STATE_NAMES.forEach((name) => {
    map.set(normalizeStateInput(name), name);
  });
  Object.entries(INDIAN_STATE_CODE_MAP).forEach(([code, name]) => {
    map.set(normalizeStateInput(code), name);
  });
  return map;
})();

function isValidIndianPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  close: () => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

async function loadRazorpayScript(): Promise<RazorpayConstructor | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.Razorpay) {
    return window.Razorpay;
  }

  return new Promise((resolve) => {
    const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(window.Razorpay ?? null),
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => resolve(null),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

async function initiateRazorpayPayment(
  order: CheckoutOrder,
  options: {
    name: string;
    email: string;
    phone?: string;
    guestEmail?: string | null;
    token?: string | null;
  }
): Promise<void> {
  const session = await createRazorpaySession(
    order.id,
    {
      guestEmail: options.guestEmail ?? undefined,
      contact: {
        name: options.name,
        email: options.email,
        phone: options.phone,
      },
    },
    { token: options.token ?? undefined }
  );

  const Razorpay = await loadRazorpayScript();
  if (!Razorpay) {
    throw new Error("Unable to load Razorpay checkout. Please try again.");
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const checkout = new Razorpay({
      key: session.razorpayKeyId,
      amount: session.amountPaise,
      currency: session.currency,
      name: "The Smelly Water Club",
      description: `Payment for order ${session.orderId}`,
      order_id: session.razorpayOrderId,
      prefill: {
        name: session.customer.name ?? options.name,
        email: session.customer.email ?? options.email,
        contact: session.customer.contact ?? options.phone ?? undefined,
      },
      theme: {
        color: "#db2777",
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            reject(new Error("Payment failed before completion. Please try again."));
          }
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          await confirmRazorpayPayment(
            order.id,
            {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              guestEmail: options.guestEmail ?? undefined,
            },
            { token: options.token ?? undefined }
          );
          settled = true;
          resolve();
        } catch (error) {
          settled = true;
          reject(error);
        }
      },
    });

    checkout.on?.("payment.failed", (event: { error?: { description?: string } }) => {
      if (settled) {
        return;
      }
      settled = true;
      const message = event?.error?.description ?? "Payment failed. Please try again.";
      reject(new Error(message));
    });

    try {
      checkout.open();
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error instanceof Error ? error : new Error("Unable to open payment window."));
      }
    }
  });
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

function isValidIndianPhone(phone: string): boolean {
  const digits = normalizePhoneNumber(phone);
  if (!digits) return true;
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return true;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^[6-9]/.test(digits.slice(2));
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return /^[6-9]/.test(digits.slice(1));
  }
  return false;
}

function resolveIndianState(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = normalizeStateInput(value);
  if (normalized === "pondicherry") {
    return "Puducherry";
  }
  return INDIAN_STATE_LOOKUP.get(normalized) ?? null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutMode =
    searchParams.get("mode") === "buy-now" ? "buy-now" : "cart";
  const items = useCartStore(cartItemsSelector);
  const clearCart = useCartStore((state) => state.clear);
  const buyNowItem = useBuyNowStore((state) => state.item);
  const setBuyNowItem = useBuyNowStore((state) => state.setItem);
  const clearBuyNow = useBuyNowStore((state) => state.clear);
  const authUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);

  const detailedItems = useMemo<DetailedItem[]>(() => {
    if (checkoutMode === "buy-now") {
      if (!buyNowItem) {
        return [];
      }
      const qty = Math.max(1, Math.round(buyNowItem.qty));
      return [
        {
          key: `${buyNowItem.details.product.slug}-${buyNowItem.details.variant.id}`,
          qty,
          details: buyNowItem.details,
          unitPricePaise: getUnitPricePaise(buyNowItem.details),
        },
      ];
    }

    return items
      .map((item) => {
        let details = item.details ?? null;
        if (!details) {
          const product = getProductBySlug(item.productSlug);
          if (!product) return null;
          const variant =
            getProductVariant(product.slug, item.variantId) ??
            product.variants.find((entry) => entry.id === item.variantId);
          if (!variant) return null;
          details = buildCartItemDetails(product, variant);
        }

        const available = getAvailableUnits(details);
        const normalizedQty = Math.max(1, Math.round(item.qty));
        const qty =
          available > 0 ? Math.min(normalizedQty, available) : 0;

        if (qty <= 0) {
          return null;
        }

        return {
          key: `${details.product.slug}-${details.variant.id}`,
          qty,
          details,
          unitPricePaise: getUnitPricePaise(details),
        };
      })
      .filter((entry): entry is DetailedItem => entry !== null);
  }, [checkoutMode, buyNowItem, items]);

  const itemsSubtotal = useMemo(
    () =>
      detailedItems.reduce(
        (sum, item) => sum + item.unitPricePaise * item.qty,
        0
      ),
    [detailedItems]
  );
  const subtotal = itemsSubtotal;
  const cartWeightEstimate = useMemo(() => {
    const baseWeight = detailedItems.reduce((sum, item) => {
      const size = item.details.variant.sizeMl;
      const perUnit = Number.isFinite(size) && size > 0 ? Number(size) : 250;
      const normalized = Math.max(250, Math.round(perUnit * 1.1));
      return sum + normalized * item.qty;
    }, 0);
    return Math.max(500, baseWeight || 0);
  }, [detailedItems]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [shipping, setShipping] = useState({
    name: authUser?.name ?? "Jane Doe",
    email: authUser?.email ?? "",
    phone: authUser?.phone ?? "+91 98765 43210",
    line1: "221 MG Road",
    line2: "",
    city: "Bengaluru",
    state: "Karnataka",
    zip: "560001",
    country: "India",
    date: "",
    notes: "",
  });
  const [payTab, setPayTab] = useState("card");
  const paymentType = payTab === "cod" ? "COD" : "Prepaid";

  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const {
    serviceability,
    serviceabilityError,
    isCheckingServiceability,
    checkServiceability,
  } = useServiceability(shipping.zip, {
    declaredValuePaise: itemsSubtotal,
    weightGrams: cartWeightEstimate,
    paymentType: paymentType === "COD" ? "COD" : "Prepaid",
  });

type ShipMethod = "standard" | "express" | "overnight" | "live";
  const [shipMethod, setShipMethod] = useState<ShipMethod>("standard");
  useEffect(() => {
    if (hasLiveQuote && shipMethod !== "live") {
      setShipMethod("live");
    } else if (!hasLiveQuote && shipMethod === "live") {
      setShipMethod("standard");
    }
  }, [ shipMethod]);

  const delhiveryCharge = useMemo(() => {
    if (!serviceability) {
      return null;
    }
    if (paymentType === "COD") {
      return (
        serviceability.charges.cod ??
        serviceability.charges.total ??
        serviceability.charges.base
      );
    }
    return serviceability.charges.total ?? serviceability.charges.base;
  }, [serviceability, paymentType]);

  const hasLiveQuote = typeof delhiveryCharge === "number" && Number.isFinite(delhiveryCharge);

  const shipRate = useMemo(() => {
    if (hasLiveQuote) {
      return Math.max(0, Math.round(delhiveryCharge));
    }
    return shipMethod === "standard"
      ? 299
      : shipMethod === "express"
      ? 599
      : 999;
  }, [hasLiveQuote, delhiveryCharge, shipMethod]);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    setShipping((current) => {
      const hasCustomName = current.name && current.name !== "Jane Doe";
      return {
        ...current,
        name: hasCustomName ? current.name : authUser.name,
        email: authUser.email,
        phone: authUser.phone ?? current.phone,
        country: "India",
      };
    });
  }, [authUser]);
  useEffect(() => {
    if (checkoutMode !== "buy-now") {
      return;
    }
    if (!buyNowItem || detailedItems.length === 0) {
      return;
    }
    const target = detailedItems[0];
    if (target.qty !== buyNowItem.qty) {
      setBuyNowItem({ details: buyNowItem.details, qty: target.qty });
    }
  }, [checkoutMode, buyNowItem, detailedItems, setBuyNowItem]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const isCodAllowed = Boolean(
    serviceability?.isServiceable && serviceability.codAvailable
  );

  useEffect(() => {
    if (payTab === "cod" && !isCodAllowed) {
      setPayTab("card");
    }
  }, [payTab, isCodAllowed]);

  const handleServiceabilityCheck = useCallback(() => {
    void checkServiceability();
  }, [checkServiceability]);

const serviceabilityEstimate = useMemo(
  () => (serviceability ? formatEstimatedDelivery(serviceability) : null),
  [serviceability]
);

const shipEta =
  serviceabilityEstimate ??
  (shipMethod === "standard"
    ? "3–5 business days"
    : shipMethod === "express"
    ? "2–3 business days"
    : "1–2 business days");

  const shippingPinDisplay = useMemo(
    () => (shipping.zip.trim() || "this PIN"),
    [shipping.zip]
  );

  type ShippingOption = {
    value: ShipMethod;
    label: string;
    eta: string;
    description?: string;
    amount: number;
  };

  const shippingOptions = useMemo<ShippingOption[]>(() => {
    if (hasLiveQuote) {
      return [
        {
          value: "live",
          label: serviceability?.isServiceable
            ? `Deliver to ${shippingPinDisplay}`
            : "Courier delivery",
          eta: shipEta,
          description: serviceabilityEstimate
            ? `Estimated delivery ${shipEta}`
            : "Dynamic courier rate",
          amount: shipRate,
        },
      ];
    }
    return [
      {
        value: "standard",
        label: "Standard",
        eta: "3–5 business days",
        amount: 299,
      },
      {
        value: "express",
        label: "Express",
        eta: "2–3 business days",
        amount: 599,
      },
      {
        value: "overnight",
        label: "Overnight",
        eta: "1–2 business days",
        amount: 999,
      },
    ];
  }, [hasLiveQuote, serviceability?.isServiceable, shippingPinDisplay, serviceabilityEstimate, shipRate, shipEta]);


  const tax = Math.round((subtotal + shipRate) * 0.18 * 100) / 100;
  const total = Math.round((subtotal + shipRate + tax) * 100) / 100;

  function validateAddress() {
    const line1 = shipping.line1.trim();
    if (line1.length < 4) {
      setAddressError("Enter a detailed street address (at least 4 characters).");
      setAddressValid(false);
      return false;
    }

    const city = shipping.city.trim();
    if (city.length < 2) {
      setAddressError("Enter the city or locality.");
      setAddressValid(false);
      return false;
    }

    const pin = shipping.zip.trim();
    if (!isValidIndianPin(pin)) {
      setAddressError("Enter a valid six-digit Indian PIN code.");
      setAddressValid(false);
      return false;
    }

    const stateMatch = resolveIndianState(shipping.state);
    if (!stateMatch) {
      setAddressError("Select a valid Indian state or union territory.");
      setAddressValid(false);
      return false;
    }

    const normalizedCountry = shipping.country.trim().toLowerCase();
    if (!INDIA_COUNTRY_LABELS.has(normalizedCountry)) {
      setAddressError("Deliveries are limited to India. Please set the country to India.");
      setAddressValid(false);
      return false;
    }

    if (!isValidIndianPhone(shipping.phone)) {
      setAddressError("Enter a valid Indian mobile number or leave the field blank.");
      setAddressValid(false);
      return false;
    }

    const emailValue = (authUser?.email ?? shipping.email).trim();
    const emailValid = authUser?.email ? true : /\S+@\S+\.\S+/.test(emailValue);
    if (!emailValid) {
      setAddressError("Enter a valid email address for order updates.");
      setAddressValid(false);
      return false;
    }

    const updates: Partial<typeof shipping> = {};
    if (shipping.state.trim() !== stateMatch) {
      updates.state = stateMatch;
    }
    if (shipping.country.trim() !== "India") {
      updates.country = "India";
    }
    if (shipping.zip !== pin) {
      updates.zip = pin;
    }
    if (Object.keys(updates).length > 0) {
      setShipping((current) => ({ ...current, ...updates }));
    }

    setAddressError(null);
    setAddressValid(true);
    return true;
  }

  function goNext() {
    if (step === 1) {
      if (!validateAddress()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  }

  function goBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as typeof prev) : prev));
  }

  async function handlePlaceOrder(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    setOrderError(null);

    if (detailedItems.length === 0) {
      setOrderError("Your checkout session is empty.");
      return;
    }
    const email = (authUser?.email ?? shipping.email).trim();
    if (!email) {
      setOrderError("Please provide an email address for order updates.");
      setStep(1);
      return;
    }

    const shippingAddress = createCheckoutAddressFromShipping(shipping);
    const billingAddress = shippingAddress;
  const shippingCharge = Math.max(0, Math.round(shipRate));
  const taxCharge = Math.max(0, Math.round(tax));

    setIsPlacingOrder(true);
    let createdOrder: CheckoutOrder | null = null;
    try {
      if (checkoutMode === "buy-now") {
        const target = detailedItems[0];
        createdOrder = await submitBuyNowCheckout(
          {
            item: {
              variantId: target.details.variant.id,
              quantity: target.qty,
            },
            shippingAddress,
            billingAddress,
            notes: shipping.notes.trim() ? shipping.notes.trim() : undefined,
            contact: {
              email,
              phone: shipping.phone.trim() || undefined,
            },
            paymentMode: payTab === "cod" ? "COD" : "PREPAID",
            pricing: {
              shippingPaise: shippingCharge,
              taxPaise: taxCharge,
            },
          },
          { token: authToken ?? undefined }
        );
      } else {
        const guestToken = await syncRemoteCart(
          detailedItems.map((line) => ({
            variantId: line.details.variant.id,
            quantity: line.qty,
          })),
          { token: authToken ?? undefined }
        );

        createdOrder = await submitCartCheckout(
          {
            shippingAddress,
            billingAddress,
            notes: shipping.notes.trim() ? shipping.notes.trim() : undefined,
            contact: {
              email,
              phone: shipping.phone.trim() || undefined,
            },
            paymentMode: payTab === "cod" ? "COD" : "PREPAID",
            pricing: {
              shippingPaise: shippingCharge,
              taxPaise: taxCharge,
            },
          },
          {
            token: authToken ?? undefined,
            guestToken,
          }
        );
      }

      if (!createdOrder) {
        throw new Error("Unable to create order. Please try again.");
      }

      const requiresOnlinePayment =
        createdOrder.totals.totalPaise > 0 && payTab !== "cod";

      if (requiresOnlinePayment) {
        await initiateRazorpayPayment(createdOrder, {
          name: shipping.name.trim() || "Guest Customer",
          email,
          phone: shipping.phone.trim() || undefined,
          guestEmail: authUser ? null : email,
          token: authToken ?? undefined,
        });
      }

      if (authUser && authToken && createdOrder.items.length > 0) {
        try {
          const shipmentResults = await createShipmentsForOrder(createdOrder, {
            shippingAddress,
            contact: {
              name: shipping.name.trim() || "Guest Customer",
              email,
              phone: shipping.phone.trim() || undefined,
            },
            paymentType,
            promisedDeliveryDate: serviceability?.estimatedDeliveryDate ?? null,
            token: authToken,
          });

          if (
            shipmentResults.some((entry) => entry.status === "rejected") &&
            process.env.NODE_ENV !== "production"
          ) {
            console.warn("[checkout] some shipments failed to register", shipmentResults);
          }
        } catch (shipmentError) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[checkout] shipment creation failed", shipmentError);
          }
        }
      }

      if (checkoutMode !== "buy-now") {
        clearCart();
      }
      clearBuyNow();

      if (authUser) {
        router.replace("/account");
      } else {
        const params = new URLSearchParams({
          orderId: createdOrder.id,
          email,
        });
        router.replace(`/order-confirmation?${params.toString()}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[checkout] order placement failed", error);
      }
      if (createdOrder) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Payment could not be completed. Please try again.";
        setOrderError(message);
      } else {
        if (error instanceof ApiError) {
          const message = (() => {
            if (
              typeof error.body === "object" &&
              error.body !== null &&
              "error" in error.body
            ) {
              const payload = (error.body as { error?: unknown }).error;
              if (typeof payload === "object" && payload !== null) {
                const base =
                  "message" in payload &&
                  typeof (payload as { message?: unknown }).message === "string"
                    ? (payload as { message: string }).message
                    : error.message;
                const detail =
                  "detail" in payload &&
                  typeof (payload as { detail?: unknown }).detail === "string"
                    ? (payload as { detail: string }).detail
                    : null;
                return detail ? `${base} (${detail})` : base;
              }
            }
            return error.message;
          })();
          setOrderError(message);
        } else if (error instanceof Error) {
          setOrderError(error.message);
        } else {
          setOrderError("Unexpected error placing order.");
        }
      }
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (detailedItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-xl font-semibold">
              {checkoutMode === "buy-now"
                ? "Your buy now selection has expired"
                : "Your cart is currently empty"}
            </h1>
            <p className="text-sm text-gray-600">
              {checkoutMode === "buy-now"
                ? "Pick a fragrance and tap Buy Now again to restart checkout."
                : "Add a fragrance to your cart to begin checkout."}
            </p>
            <Button onClick={() => router.push("/")}>
              Browse The Smelly Water Club
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/cart")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to cart
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>SSL Secure • PCI ready</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="grid grid-cols-4 gap-2 text-xs md:text-sm">
          {["Shipping", "Method", "Payment", "Review"].map((label, index) => {
            const active = step === (index + 1);
            const done = step > (index + 1);
            return (
              <div
                key={label}
                className={cnStepper(active, done)}
              >
                {label}
              </div>
            );
          })}
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-8">
          {step === 1 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Shipping Information</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Estimated delivery:{" "}
                    <span className="font-medium">{shipEta}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="saved-address"
                    checked={useSavedAddress}
                    onCheckedChange={(value) => setUseSavedAddress(value)}
                  />
                  <Label htmlFor="saved-address" className="text-sm">
                    Use saved address
                  </Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="ship-name">Name</Label>
                    <Input
                      id="ship-name"
                      value={shipping.name}
                      onChange={(event) =>
                        setShipping({ ...shipping, name: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-phone">Phone</Label>
                    <Input
                      id="ship-phone"
                      value={shipping.phone}
                      onChange={(event) =>
                        setShipping({ ...shipping, phone: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-email">Email</Label>
                    <Input
                      id="ship-email"
                      type="email"
                      value={shipping.email}
                      onChange={(event) =>
                        setShipping({ ...shipping, email: event.target.value })
                      }
                      required={!authUser}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-line1">Address line 1</Label>
                    <Input
                      id="ship-line1"
                      value={shipping.line1}
                      onChange={(event) =>
                        setShipping({ ...shipping, line1: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-line2">Address line 2 (optional)</Label>
                    <Input
                      id="ship-line2"
                      value={shipping.line2}
                      onChange={(event) =>
                        setShipping({ ...shipping, line2: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-city">City</Label>
                    <Input
                      id="ship-city"
                      value={shipping.city}
                      onChange={(event) =>
                        setShipping({ ...shipping, city: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-state">State/Region</Label>
                    <Input
                      id="ship-state"
                      value={shipping.state}
                      onChange={(event) =>
                        setShipping({ ...shipping, state: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-zip">ZIP / PIN</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          id="ship-zip"
                          className="flex-1"
                          value={shipping.zip}
                          maxLength={6}
                          onChange={(event) => {
                            const digitsOnly = event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setShipping({ ...shipping, zip: digitsOnly });
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleServiceabilityCheck}
                          disabled={isCheckingServiceability}
                        >
                          {isCheckingServiceability ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Check delivery
                        </Button>
                      </div>
                      {serviceabilityError ? (
                        <p className="text-xs text-rose-600">{serviceabilityError}</p>
                      ) : null}
                      {serviceability ? (
                        <div
                          className={`rounded-lg border p-3 text-xs ${
                            serviceability.isServiceable
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MapPin className="h-4 w-4" />
                            {serviceability.isServiceable
                              ? `Delivery available to ${shippingPinDisplay}`
                              : `Not deliverable to ${shippingPinDisplay}`}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-current">
                            {serviceabilityEstimate ? (
                              <p>
                                Estimated delivery
                                {" "}
                                <span className="font-semibold">
                                  {serviceabilityEstimate}
                                </span>
                              </p>
                            ) : null}
                            {serviceability.isServiceable ? (
                              <>
                                <p>
                                  Prepaid:{" "}
                                  <span className="font-semibold">Available</span>
                                </p>
                                <p>
                                  Cash on delivery:{" "}
                                  <span className="font-semibold">
                                    {serviceability.codAvailable
                                      ? "Available"
                                      : "Not available"}
                                  </span>
                                </p>
                              </>
                            ) : (
                              <p>Try a different PIN or contact support for assistance.</p>
                            )}
                            {serviceability.charges.total != null ? (
                              <p>
                                Indicative shipping charge
                                {" "}
                                <span className="font-semibold">
                                  {formatCurrencyINR(serviceability.charges.total)}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ship-country">Country</Label>
                    <Input
                      id="ship-country"
                      value={shipping.country}
                      onChange={(event) =>
                        setShipping({
                          ...shipping,
                          country: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-date">Delivery date (optional)</Label>
                    <Input
                      id="ship-date"
                      placeholder="YYYY-MM-DD"
                      value={shipping.date}
                      onChange={(event) =>
                        setShipping({ ...shipping, date: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-notes">Special delivery instructions</Label>
                    <Input
                      id="ship-notes"
                      placeholder="Leave at reception, call on arrival, etc."
                      value={shipping.notes}
                      onChange={(event) =>
                        setShipping({ ...shipping, notes: event.target.value })
                      }
                    />
                  </div>
                </div>

                {addressValid === false && (
                  <div className="text-sm text-rose-600">
                    {addressError ?? "Please double-check your shipping details."}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/cart")}>
                    Back to cart
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Continue to Shipping Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <h2 className="text-lg font-semibold">Shipping Method</h2>
                <RadioGroup
                  value={shipMethod}
                  onValueChange={(value) => setShipMethod(value as ShipMethod)}
                  className="space-y-3"
                >
                  {shippingOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center justify-between rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value={option.value}
                          id={`ship-${option.value}`}
                          disabled={shippingOptions.length === 1}
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-600">
                            {option.description ?? option.eta}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatPaise(option.amount, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                <div className="text-sm text-gray-600">
                  Estimated delivery:{" "}
                  <span className="font-medium">{shipEta}</span>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Payment</h2>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Lock className="h-4 w-4" /> Secure 256-bit encryption
                  </div>
                </div>

                <Tabs
                  value={payTab}
                  onValueChange={setPayTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger
                      value="card"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger
                      value="upi"
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      UPI
                    </TabsTrigger>
                    <TabsTrigger
                      value="cod"
                      className="flex items-center gap-2"
                      disabled={!isCodAllowed}
                    >
                      <Package className="h-4 w-4" />
                      Cash on Delivery
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="mt-4">
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        We’ll hand off to Razorpay so you can securely enter your credit or debit card details.
                      </p>
                      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                        After placing the order you’ll be redirected to the Razorpay payment window to complete the transaction.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upi" className="mt-4">
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        Pay instantly using any UPI app such as PhonePe, Google Pay, or BHIM.
                      </p>
                      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                        You’ll be prompted to approve the payment request in your UPI app right after placing the order.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cod" className="mt-4">
                    {isCodAllowed ? (
                      <div className="space-y-3 text-sm text-gray-700">
                        <p>
                          Pay with cash or UPI at the time of delivery. Our courier will contact you prior to arrival.
                        </p>
                        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                          Please keep the exact amount ready. Orders above ₹7,500 may require a quick reconfirmation call.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        Cash on delivery isn&apos;t available for {shippingPinDisplay}. Please pick a prepaid option instead.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <h2 className="text-lg font-semibold">Review &amp; Confirm</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-1 font-medium">Shipping to</h3>
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">
                        {shipping.name} • {shipping.phone}
                      </div>
                      <div>
                        {shipping.line1}
                        {shipping.line2 ? `, ${shipping.line2}` : ""}
                      </div>
                      <div>
                        {shipping.city}, {shipping.state} {shipping.zip}
                      </div>
                      <div>{shipping.country}</div>
                      {shipping.notes && (
                        <div className="mt-1 text-gray-500">
                          Note: {shipping.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-medium">Delivery</h3>
                    <div className="text-sm text-gray-700">
                      {shipMethod.toUpperCase()} • {shipEta} • ETA{" "}
                      <span className="font-medium">{shipEta}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-2 font-medium">Items</h3>
                  <div className="space-y-3">
                    {detailedItems.map((item) => {
                      const image =
                        item.details.product.imageUrl ?? FALLBACK_IMAGE_URL;
                      const alt =
                        item.details.product.imageAlt ??
                        item.details.product.title;
                      const variantLabel = `${item.details.variant.sizeMl} ml`;
                      return (
                        <div key={item.key} className="flex items-center gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                            <img
                              src={image}
                              alt={alt}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {item.details.product.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {variantLabel} • Qty {item.qty}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatPaise(item.unitPricePaise * item.qty, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="order-terms" />
                  <Label htmlFor="order-terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="#" className="underline">
                      Terms &amp; Conditions
                    </Link>
                    .
                  </Label>
                </div>

                {orderError && (
                  <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {orderError}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button
          className="bg-pink-600 hover:bg-pink-700"
          onClick={(event) => handlePlaceOrder(event.nativeEvent)}
          disabled={isPlacingOrder}
        >
                    {isPlacingOrder ? "Placing order…" : "Place Order"}
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Info className="h-4 w-4" />
                  By placing your order, you confirm you’ve reviewed shipping
                  dates, prices, and returns policy.
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="lg:col-span-4">
          <Card className="rounded-2xl lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-4 md:p-6">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPaise(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPaise(shipRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>{formatPaise(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPaise(total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Payments processed with PCI DSS compliant gateways
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-2xl">
            <CardContent className="p-4 md:p-6 text-sm text-gray-700">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Truck className="h-4 w-4" />
                Address validation
              </div>
              <div
                className={`text-xs ${
                  addressValid === false ? "text-rose-600" : "text-gray-600"
                }`}
              >
                {addressValid === false && addressError
                  ? addressError
                  : "We’ll validate your address in real-time at purchase. Invalid addresses may delay delivery."}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

function cnStepper(active: boolean, done: boolean) {
  if (active) {
    return "rounded-full border border-pink-600 px-3 py-2 text-center text-pink-700";
  }
  if (done) {
    return "rounded-full border border-emerald-500 px-3 py-2 text-center text-emerald-700";
  }
  return "rounded-full border border-gray-200 px-3 py-2 text-center text-gray-600";
}
