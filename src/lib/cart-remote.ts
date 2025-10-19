"use client";

import { apiFetch, ApiError } from "@/lib/api-client";

const CART_TOKEN_HEADER = "x-cart-token";
const STORAGE_KEY = "smelly-water-guest-cart-token";

type RemoteCartItem = {
  variantId: string;
  quantity: number;
};

type CartPayload = {
  id: string;
  items: RemoteCartItem[];
};

type CartResponseEnvelope = {
  data: CartPayload;
  meta?: {
    guestToken?: string | null;
  };
};

function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredGuestToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function buildHeaders(guestToken?: string | null): HeadersInit | undefined {
  if (guestToken) {
    return {
      [CART_TOKEN_HEADER]: guestToken,
    };
  }
  return undefined;
}

function updateGuestTokenFromResponse(
  envelope: CartResponseEnvelope | undefined,
  fallbackToken: string | null
): string | null {
  const nextToken = envelope?.meta?.guestToken ?? fallbackToken ?? null;
  setStoredGuestToken(nextToken);
  return nextToken;
}

async function requestCart(
  path: string,
  init: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    json?: unknown;
    token?: string;
    guestToken?: string | null;
  }
): Promise<{ payload: CartResponseEnvelope; guestToken: string | null }> {
  const envelope = await apiFetch<CartResponseEnvelope>(path, {
    method: init.method,
    json: init.json,
    token: init.token,
    headers: buildHeaders(init.guestToken),
  });
  const guestToken = updateGuestTokenFromResponse(envelope, init.guestToken ?? null);
  return {
    payload: envelope,
    guestToken,
  };
}

export async function syncRemoteCart(
  items: RemoteCartItem[],
  options: { token?: string } = {}
): Promise<string | null> {
  let guestToken = getStoredGuestToken();

  try {
    const result = await requestCart("/api/cart", {
      method: "GET",
      token: options.token,
      guestToken,
    });
    guestToken = result.guestToken;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    guestToken = null;
    setStoredGuestToken(null);
  }

  try {
    const result = await requestCart("/api/cart", {
      method: "DELETE",
      token: options.token,
      guestToken,
    });
    guestToken = result.guestToken;
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 404)) {
      throw error;
    }
    guestToken = null;
    setStoredGuestToken(null);
  }

  for (const item of items) {
    const result = await requestCart("/api/cart/items", {
      method: "POST",
      token: options.token,
      guestToken,
      json: {
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
    guestToken = result.guestToken;
  }

  return guestToken ?? null;
}
