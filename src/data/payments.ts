import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";

export type RazorpayCustomer = {
  name: string | null;
  email: string | null;
  contact: string | null;
};

export type RazorpaySession = {
  orderId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  receipt: string | null;
  customer: RazorpayCustomer;
};

export type RazorpayConfirmation = {
  orderId: string;
  paymentId: string | null;
  status: string;
  method: string | null;
  amountPaise: number;
  orderStatus: string;
};

type SessionResponse = ApiResponseEnvelope<RazorpaySession>;
type ConfirmationResponse = ApiResponseEnvelope<RazorpayConfirmation>;

export async function createRazorpaySession(
  orderId: string,
  input: {
    guestEmail?: string;
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  },
  options: { token?: string } = {},
): Promise<RazorpaySession> {
  try {
    const response = await apiFetch<SessionResponse>(
      `/api/payments/orders/${orderId}/razorpay`,
      {
        method: "POST",
        json: {
          guestEmail: input.guestEmail,
          contact: {
            name: input.contact?.name,
            email: input.contact?.email,
            phone: input.contact?.phone,
          },
        },
        token: options.token,
      },
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to create Razorpay payment session", 502, null);
  }
}

export async function confirmRazorpayPayment(
  orderId: string,
  input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    guestEmail?: string;
  },
  options: { token?: string } = {},
): Promise<RazorpayConfirmation> {
  try {
    const response = await apiFetch<ConfirmationResponse>(
      `/api/payments/orders/${orderId}/razorpay/confirm`,
      {
        method: "POST",
        json: {
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature,
          guestEmail: input.guestEmail,
        },
        token: options.token,
      },
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to confirm Razorpay payment", 502, null);
  }
}
