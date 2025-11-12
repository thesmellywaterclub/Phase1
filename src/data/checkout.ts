import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";

export type CheckoutAddressInput = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type CheckoutContactInput = {
  email: string;
  phone?: string;
};

export type BuyNowCheckoutInput = {
  item: {
    variantId: string;
    quantity: number;
  };
  shippingAddress: CheckoutAddressInput;
  billingAddress: CheckoutAddressInput;
  notes?: string;
  contact?: CheckoutContactInput;
  paymentMode: "COD" | "PREPAID";
  pricing?: CheckoutPricingInput;
};

export type CheckoutOrderTotals = {
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
};

export type CheckoutOrderItem = {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  quantity: number;
  sizeMl: number;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export type CheckoutOrder = {
  id: string;
  status: string;
  notes: string | null;
  guestEmail: string | null;
  billingAddress: Record<string, unknown>;
  shippingAddress: Record<string, unknown>;
  totals: CheckoutOrderTotals;
  items: CheckoutOrderItem[];
};

type BuyNowCheckoutResponse = ApiResponseEnvelope<CheckoutOrder>;

export async function submitBuyNowCheckout(
  input: BuyNowCheckoutInput,
  options: { token?: string } = {}
): Promise<CheckoutOrder> {
  try {
    const response = await apiFetch<BuyNowCheckoutResponse>(
      "/api/checkout/buy-now",
      {
        method: "POST",
        json: input,
        token: options.token,
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Failed to complete buy-now checkout",
      500,
      error instanceof Error ? { message: error.message } : null
    );
  }
}

export type CartCheckoutInput = {
  shippingAddress: CheckoutAddressInput;
  billingAddress: CheckoutAddressInput;
  notes?: string;
  contact?: CheckoutContactInput;
  paymentMode: "COD" | "PREPAID";
  pricing?: CheckoutPricingInput;
};

export type CheckoutPricingInput = {
  shippingPaise?: number;
  taxPaise?: number;
  discountPaise?: number;
};

type CartCheckoutResponse = ApiResponseEnvelope<CheckoutOrder>;

export async function submitCartCheckout(
  input: CartCheckoutInput,
  options: { token?: string; guestToken?: string | null } = {}
): Promise<CheckoutOrder> {
  try {
    const response = await apiFetch<CartCheckoutResponse>("/api/checkout", {
      method: "POST",
      json: input,
      token: options.token,
      headers: options.guestToken
        ? {
            "x-cart-token": options.guestToken,
          }
        : undefined,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Failed to complete checkout",
      500,
      error instanceof Error ? { message: error.message } : null
    );
  }
}
