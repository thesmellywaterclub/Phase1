export type SellerLocationStatus = "UNVERIFIED" | "ACTIVE" | "SUSPENDED";

export type SellerLocation = {
  id: string;
  label: string;
  address1: string;
  address2: string | null;
  status: SellerLocationStatus;
  delhiveryPickupCode: string;
  delhiveryVerified: boolean;
  city: string;
  state: string;
  pincode: string;
  contactName: string | null;
  contactPhone: string | null;
  lastVerifiedAt: string | null;
};

export type SellerOfferCondition = "NEW" | "OPEN_BOX" | "TESTER";
export type SellerOfferAuthGrade = "SEALED" | "STORE_BILL" | "VERIFIED_UNKNOWN";

export type SellerOfferVariant = {
  id: string;
  sku: string;
  sizeMl: number;
  mrpPaise: number;
  salePaise: number | null;
  product: {
    id: string;
    title: string;
    slug: string;
    brand: {
      id: string;
      name: string;
    };
  };
};

export type SellerOffer = {
  id: string;
  partnerSku: string | null;
  price: number;
  shipping: number;
  mrp: number | null;
  stockQty: number;
  isActive: boolean;
  condition: SellerOfferCondition;
  authGrade: SellerOfferAuthGrade;
  effectivePrice: number;
  expiresAt: string | null;
  authRank: number;
  condRank: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  variant: SellerOfferVariant;
  location: SellerLocation;
};

export type SellerOfferOperation = "created" | "updated";

export type SellerSummary = {
  id: string;
  name: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertSellerOfferInput = {
  offerId?: string;
  variantId: string;
  sellerLocationId: string;
  partnerSku?: string;
  price: number;
  shipping?: number;
  stockQty: number;
  mrp?: number | null;
  isActive?: boolean;
  condition: SellerOfferCondition;
  authGrade: SellerOfferAuthGrade;
  expiresAt?: string | null;
};

export type CatalogVariantSearchItem = {
  id: string;
  sku: string;
  sizeMl: number;
  mrpPaise: number;
  salePaise: number | null;
  isActive: boolean;
  product: {
    id: string;
    title: string;
    slug: string;
    brand: {
      id: string;
      name: string;
    };
  };
};

type ApiResponseEnvelope<T> = {
  data: T;
};

export class SellerApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "SellerApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponseEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: init.cache ?? "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new SellerApiError(message, response.status, payload);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload)
  ) {
    throw new SellerApiError("Malformed response from server", 500, payload);
  }

  return payload as ApiResponseEnvelope<T>;
}

export async function getSellerOffers(): Promise<SellerOffer[]> {
  const response = await request<SellerOffer[]>("/api/seller/offers");
  return response.data;
}

export async function getSellerLocations(): Promise<SellerLocation[]> {
  const response = await request<SellerLocation[]>("/api/seller/locations");
  return response.data;
}

export async function getCatalogVariants(options: {
  limit?: number;
  brandId?: string;
  productId?: string;
} = {}): Promise<CatalogVariantSearchItem[]> {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set("limit", String(options.limit));
  }
  if (options.brandId) {
    params.set("brandId", options.brandId);
  }
  if (options.productId) {
    params.set("productId", options.productId);
  }

  const query = params.toString();
  const response = await request<CatalogVariantSearchItem[]>(
    query ? `/api/catalog/variants?${query}` : "/api/catalog/variants"
  );
  return response.data;
}

export async function upsertSellerOffer(
  input: UpsertSellerOfferInput
): Promise<{
  offer: SellerOffer;
  operation: SellerOfferOperation;
}> {
  const response = await request<{
    offer: SellerOffer;
    operation: SellerOfferOperation;
  }>("/api/seller/offers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return response.data;
}

export type SellerRegistrationInput = {
  business: {
    legalName: string;
    displayName: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
  };
  pickup: {
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    delhiveryPickupCode: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
  };
  acceptTerms: boolean;
};

export type SellerRegistrationResult = {
  seller: SellerSummary;
  location: SellerLocation;
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    avatarUrl: string | null;
    isSeller: boolean;
    isAdmin: boolean;
    clubMember: boolean;
    clubVerified: boolean;
    sellerId: string | null;
  };
};

export async function searchCatalogVariants(
  query: string,
  limit?: number
): Promise<CatalogVariantSearchItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: trimmed });
  if (limit) {
    params.set("limit", String(limit));
  }

  const response = await request<CatalogVariantSearchItem[]>(
    `/api/catalog/variants/search?${params.toString()}`
  );
  return response.data;
}

export async function registerSellerAccount(
  input: SellerRegistrationInput,
  token?: string
): Promise<SellerRegistrationResult> {
  const sanitizedToken =
    typeof token === "string"
      ? token.replace(/^"+|"+$/g, "").trim()
      : undefined;
  const headerToken =
    sanitizedToken && sanitizedToken.length > 0 ? sanitizedToken : undefined;
  const response = await request<SellerRegistrationResult>("/api/seller/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headerToken ? { Authorization: `Bearer ${headerToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
  return response.data;
}
