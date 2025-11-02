import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";
import { formatPaise } from "@/lib/money";

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  verified: boolean;
};

export type CustomerAddress = {
  id: number;
  type: "Shipping" | "Billing";
  name: string;
  line1: string;
  city: string;
  zip: string;
  country: string;
  default: boolean;
};

export type CustomerOrder = {
  id: string;
  date: string;
  total: string;
  status: string;
  tracking: {
    id: string | null;
    carrier: string | null;
    currentLocation: string | null;
    expectedDelivery: string | null;
    status: string | null;
  };
  items: Array<{ name: string; qty: number }>;
};

export type CustomerPaymentMethod = {
  id: number;
  type: string;
  last4: string;
  expiry: string;
  default: boolean;
};

export type CustomerPreferences = {
  email: boolean;
  sms: boolean;
};

export type CustomerProfileData = {
  profile: CustomerProfile;
  addresses: CustomerAddress[];
  orders: CustomerOrder[];
  paymentMethods: CustomerPaymentMethod[];
  preferences: CustomerPreferences;
};

const mockCustomer: CustomerProfileData = {
  profile: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555-123-4567",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    verified: true,
  },
  addresses: [
    {
      id: 1,
      type: "Shipping",
      name: "Home",
      line1: "123 Ocean Drive",
      city: "Miami",
      zip: "33139",
      country: "USA",
      default: true,
    },
    {
      id: 2,
      type: "Billing",
      name: "Office",
      line1: "456 Downtown Ave",
      city: "New York",
      zip: "10001",
      country: "USA",
      default: false,
    },
  ],
  orders: [
    {
      id: "ORD-1001",
      date: "2025-09-20",
      total: "$129.99",
      status: "Delivered",
      tracking: {
        id: "TRK-789456",
        carrier: "FedEx",
        currentLocation: "Miami, FL",
        expectedDelivery: "2025-09-25",
        status: "Delivered",
      },
      items: [
        { name: "Rose Essence Perfume", qty: 1 },
        { name: "Ocean Breeze Eau de Toilette", qty: 2 },
      ],
    },
    {
      id: "ORD-1002",
      date: "2025-10-02",
      total: "$89.00",
      status: "In Transit",
      tracking: {
        id: "TRK-123654",
        carrier: "UPS",
        currentLocation: "Atlanta, GA",
        expectedDelivery: "2025-10-09",
        status: "In Transit",
      },
      items: [{ name: "Amber Nights Perfume", qty: 1 }],
    },
  ],
  paymentMethods: [
    { id: 1, type: "Visa", last4: "4242", expiry: "09/27", default: true },
    { id: 2, type: "Mastercard", last4: "1234", expiry: "01/26", default: false },
  ],
  preferences: {
    email: true,
    sms: false,
  },
};

type ApiUserSummary = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  isSeller: boolean;
  clubMember: boolean;
  clubVerified: boolean;
  sellerId: string | null;
};

type ApiOrderSummary = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalPaise: number;
  itemCount: number;
};

type ApiOrderListResponse = {
  data: ApiOrderSummary[];
  meta: {
    nextCursor: string | null;
  };
};

type ApiOrderItem = {
  id: string;
  title: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  variantId: string;
  productId: string;
  sizeMl: number;
};

type ApiShipment = {
  id: string;
  trackingNumber: string | null;
  status: string;
};

type ApiOrderDetail = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  itemCount: number;
  items: ApiOrderItem[];
  shipments: ApiShipment[];
  billingAddress: Record<string, unknown>;
  shippingAddress: Record<string, unknown>;
};

type ApiOrderDetailResponse = ApiResponseEnvelope<ApiOrderDetail>;
type ApiAuthMeResponse = ApiResponseEnvelope<ApiUserSummary>;

function mockClone(): CustomerProfileData {
  return JSON.parse(JSON.stringify(mockCustomer));
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatOrderDate(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function extractString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function mapAddress(
  record: Record<string, unknown>,
  type: CustomerAddress["type"],
): Omit<CustomerAddress, "id" | "default"> | null {
  const line1 = extractString(record, "line1");
  const city = extractString(record, "city");
  if (!line1 || !city) {
    return null;
  }

  const firstName = extractString(record, "firstName") ?? "";
  const lastName = extractString(record, "lastName") ?? "";
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    (type === "Shipping" ? "Primary Shipping" : "Primary Billing");

  return {
    type,
    name,
    line1,
    city,
    zip: extractString(record, "postalCode") ?? "",
    country: extractString(record, "country") ?? "",
  };
}

function buildAddresses(details: ApiOrderDetail[]): CustomerAddress[] {
  const deduped = new Map<string, Omit<CustomerAddress, "id" | "default">>();

  for (const detail of details) {
    const shipping = mapAddress(detail.shippingAddress, "Shipping");
    if (shipping) {
      const key = `ship:${shipping.line1.toLowerCase()}|${shipping.city.toLowerCase()}`;
      if (!deduped.has(key)) {
        deduped.set(key, shipping);
      }
    }
    const billing = mapAddress(detail.billingAddress, "Billing");
    if (billing) {
      const key = `bill:${billing.line1.toLowerCase()}|${billing.city.toLowerCase()}`;
      if (!deduped.has(key)) {
        deduped.set(key, billing);
      }
    }
  }

  let idCounter = 1;
  return Array.from(deduped.values()).map((address, index) => ({
    id: idCounter++,
    ...address,
    default: index === 0,
  }));
}

function mapOrder(detail: ApiOrderDetail): CustomerOrder {
  const shipment = detail.shipments[0] ?? null;

  return {
    id: detail.id,
    date: formatOrderDate(detail.createdAt),
    total: formatPaise(detail.totalPaise, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    status: toTitleCase(detail.status),
    tracking: {
      id: shipment?.trackingNumber ?? null,
      carrier: shipment ? "Smelly Water Logistics" : null,
      currentLocation: shipment ? toTitleCase(shipment.status) : null,
      expectedDelivery: null,
      status: shipment ? toTitleCase(shipment.status) : null,
    },
    items: detail.items.map((item) => ({
      name: item.title,
      qty: item.quantity,
    })),
  };
}

function mapProfile(user: ApiUserSummary): CustomerProfile {
  return {
    name: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatarUrl ?? "",
    verified: user.clubVerified,
  };
}

async function fetchOrderDetail(
  orderId: string,
  token: string,
): Promise<ApiOrderDetail | null> {
  try {
    const response = await apiFetch<ApiOrderDetailResponse>(`/api/orders/${orderId}`, {
      token,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchCustomerProfile(token: string): Promise<CustomerProfileData> {
  if (!token) {
    throw new Error("Authentication token is required to fetch the customer profile.");
  }

  try {
    const [userResponse, ordersList] = await Promise.all([
      apiFetch<ApiAuthMeResponse>("/api/auth/me", { token }),
      apiFetch<ApiOrderListResponse>("/api/orders?limit=20", { token }),
    ]);

    const orderDetails = await Promise.all(
      ordersList.data.map((summary) => fetchOrderDetail(summary.id, token)),
    );

    const resolvedDetails = orderDetails.filter(
      (detail): detail is ApiOrderDetail => detail !== null,
    );

    const orders = resolvedDetails
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .map(mapOrder);

    const addresses = buildAddresses(resolvedDetails);

    const preferences: CustomerPreferences = {
      email: userResponse.data.clubMember,
      sms: Boolean(userResponse.data.phone),
    };

    return {
      profile: mapProfile(userResponse.data),
      addresses,
      orders,
      paymentMethods: [],
      preferences,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw error;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[customer] Falling back to mock data", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockClone();
  }
}
