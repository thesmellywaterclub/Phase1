import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";
import { STORE_PICKUP_LOCATION, DEFAULT_PACKAGE_DIMENSIONS_CM } from "@/config/shipping";
import type { CheckoutAddressInput, CheckoutOrder } from "@/data/checkout";

type ServiceabilityEnvelope = ApiResponseEnvelope<{
  isServiceable: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDeliveryDays: number | null;
  estimatedDeliveryDate: string | null;
  charges: {
    total: number | null;
    base: number | null;
    cod: number | null;
  };
}>;

export type ServiceabilityResult = ServiceabilityEnvelope["data"];

type TrackingEnvelope = ApiResponseEnvelope<{
  waybill: string;
  currentStatus: string;
  currentStatusCode: string | null;
  currentStatusDate: string | null;
  events: Array<{
    status: string;
    code: string | null;
    location: string | null;
    timestamp: string | null;
    remarks: string | null;
    instructions: string | null;
  }>;
}>;

export type TrackingResult = TrackingEnvelope["data"];

type CreateShipmentEnvelope = ApiResponseEnvelope<{
  shipment: {
    id: string;
    orderId: string;
    orderItemId: string;
    trackingNumber: string;
    status: string;
    provider: string;
    courierName: string | null;
    labelUrl: string | null;
    createdAt: string;
  };
  delhivery: {
    waybill: string;
    status: string | null;
    remarks: string | null;
    manifestUrl: string | null;
    raw: Record<string, unknown>;
  };
}>;

export type ShipmentCreationSummary =
  | {
      status: "fulfilled";
      orderItemId: string;
      trackingNumber: string;
      payload: CreateShipmentEnvelope["data"];
    }
  | {
      status: "rejected";
      orderItemId: string;
      error: ApiError | Error;
    };

export async function checkDeliveryServiceability(
  destinationPincode: string,
  options: {
    paymentType: "Prepaid" | "COD";
    declaredValuePaise?: number;
    weightGrams?: number;
  }
): Promise<ServiceabilityResult> {
  const declaredValueRupees =
    typeof options.declaredValuePaise === "number"
      ? Number((options.declaredValuePaise / 100).toFixed(2))
      : undefined;

  const weightGrams =
    typeof options.weightGrams === "number" && options.weightGrams > 0
      ? options.weightGrams
      : undefined;

  const response = await apiFetch<ServiceabilityEnvelope>("/api/shipments/serviceability", {
    method: "POST",
    json: {
      origin: {
        pincode: STORE_PICKUP_LOCATION.pincode,
        city: STORE_PICKUP_LOCATION.city,
        state: STORE_PICKUP_LOCATION.state,
      },
      destination: {
        pincode: destinationPincode,
      },
      shipment: {
        paymentType: options.paymentType,
        declaredValue: declaredValueRupees,
        weightGrams,
      },
    },
  });

  return response.data;
}

type ShippingContact = {
  name: string;
  email: string;
  phone?: string;
};

export async function createShipmentsForOrder(
  order: CheckoutOrder,
  params: {
    shippingAddress: CheckoutAddressInput;
    contact: ShippingContact;
    paymentType: "Prepaid" | "COD";
    promisedDeliveryDate?: string | null;
    token?: string;
  }
): Promise<ShipmentCreationSummary[]> {
  const results: ShipmentCreationSummary[] = [];

  for (const item of order.items) {
    const declaredValuePaise = item.lineTotalPaise;
    const declaredValueRupees = Number((declaredValuePaise / 100).toFixed(2));
    const weightGrams = Math.max(
      250,
      Math.round(item.sizeMl * item.quantity * 1.05)
    );

    try {
      const response = await apiFetch<CreateShipmentEnvelope>("/api/shipments", {
        method: "POST",
        token: params.token,
        json: {
          orderItemId: item.id,
          paymentType: params.paymentType,
          codAmount: params.paymentType === "COD" ? declaredValueRupees : undefined,
          pickup: {
            name: STORE_PICKUP_LOCATION.name,
            phone: STORE_PICKUP_LOCATION.phone,
            email: STORE_PICKUP_LOCATION.email,
            addressLine1: STORE_PICKUP_LOCATION.addressLine1,
            addressLine2: STORE_PICKUP_LOCATION.addressLine2,
            city: STORE_PICKUP_LOCATION.city,
            state: STORE_PICKUP_LOCATION.state,
            country: STORE_PICKUP_LOCATION.country,
            pincode: STORE_PICKUP_LOCATION.pincode,
          },
          delivery: {
            name: params.contact.name,
            phone: params.contact.phone ?? STORE_PICKUP_LOCATION.phone,
            email: params.contact.email,
            addressLine1: params.shippingAddress.line1,
            addressLine2: params.shippingAddress.line2,
            city: params.shippingAddress.city,
            state: params.shippingAddress.state,
            country: params.shippingAddress.country,
            pincode: params.shippingAddress.postalCode,
          },
          shipment: {
            description: item.title,
            weightGrams,
            lengthCm: DEFAULT_PACKAGE_DIMENSIONS_CM.length,
            widthCm: DEFAULT_PACKAGE_DIMENSIONS_CM.width,
            heightCm: DEFAULT_PACKAGE_DIMENSIONS_CM.height,
            declaredValue: declaredValueRupees,
          },
          fragile: true,
          promisedDeliveryDate: params.promisedDeliveryDate ?? undefined,
        },
      });

      results.push({
        status: "fulfilled",
        orderItemId: item.id,
        trackingNumber: response.data.shipment.trackingNumber,
        payload: response.data,
      });
    } catch (error) {
      const formattedError =
        error instanceof ApiError
          ? error
          : error instanceof Error
          ? error
          : new ApiError("Failed to create shipment", 500, null);

      results.push({
        status: "rejected",
        orderItemId: item.id,
        error: formattedError,
      });
    }
  }

  return results;
}

export async function fetchShipmentTracking(waybill: string): Promise<TrackingResult> {
  const response = await apiFetch<TrackingEnvelope>(`/api/shipments/${encodeURIComponent(waybill)}/tracking`, {
    method: "GET",
  });

  return response.data;
}
