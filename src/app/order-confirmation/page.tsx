"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Mail, Package, AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { ApiResponseEnvelope } from "@/lib/api-client";

type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  sizeMl: number;
  lineTotalPaise: number;
};

type GuestOrderDetail = {
  id: string;
  status: string;
  guestEmail: string | null;
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  items: OrderItem[];
};

async function fetchGuestOrder(orderId: string, email: string): Promise<GuestOrderDetail> {
  const query = new URLSearchParams({ orderId, email });
  try {
    const response = await apiFetch<ApiResponseEnvelope<{
      id: string;
      status: string;
      guestEmail: string | null;
      subtotalPaise: number;
      taxPaise: number;
      shippingPaise: number;
      discountPaise: number;
      totalPaise: number;
      items: { id: string; title: string; quantity: number; sizeMl: number; lineTotalPaise: number; }[];
    }>>(`/api/orders/lookup?${query.toString()}`, {
      method: "GET",
    });

    const data = response.data;
    return {
      id: data.id,
      status: data.status,
      guestEmail: data.guestEmail,
      subtotalPaise: data.subtotalPaise,
      taxPaise: data.taxPaise,
      shippingPaise: data.shippingPaise,
      discountPaise: data.discountPaise,
      totalPaise: data.totalPaise,
      items: data.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        sizeMl: item.sizeMl,
        lineTotalPaise: item.lineTotalPaise,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to load order", 502, null);
  }
}

export default function OrderConfirmationPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const email = params.get("email");

  const [order, setOrder] = useState<GuestOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      if (!orderId || !email) {
        setLoading(false);
        setError("Missing order details. Please check your email for updates.");
        return;
      }

      try {
        const result = await fetchGuestOrder(orderId, email);
        if (ignore) {
          return;
        }
        setOrder(result);
        setLoading(false);
      } catch (err) {
        if (ignore) {
          return;
        }
        if (err instanceof ApiError) {
          const message = (() => {
            const body = err.body as
              | { error?: { message?: string; detail?: string } }
              | null;
            if (body?.error?.message) {
              const detail = body.error.detail ? ` (${body.error.detail})` : "";
              return `${body.error.message}${detail}`;
            }
            return err.message;
          })();
          setError(message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("We couldn't find your order. Please check your email for details.");
        }
        setLoading(false);
      }
    }

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [orderId, email]);

  const totals = useMemo(() => {
    if (!order) {
      return null;
    }
    return {
      subtotal: formatPaise(order.subtotalPaise),
      tax: formatPaise(order.taxPaise),
      shipping: formatPaise(order.shippingPaise),
      discount: formatPaise(order.discountPaise),
      total: formatPaise(order.totalPaise),
    };
  }, [order]);

  const statusBadge = useMemo(() => {
    if (!order) {
      return null;
    }
    const base = order.status;
    switch (base) {
      case "pending":
        return "Order Pending";
      case "paid":
        return "Payment Received";
      case "processing":
        return "Being Prepared";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      case "refunded":
        return "Refunded";
      default:
        return base;
    }
  }, [order]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Thank you for your order!
                </h1>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation email to <span className="font-medium">{email ?? "your inbox"}</span>.
                  Keep an eye out for shipping updates.
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <div className="h-3 w-3 animate-pulse rounded-full bg-gray-400" />
                Fetching your order details…
              </div>
            )}

            {error && !loading && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  {error}
                  <div className="mt-2 text-xs text-rose-500">
                    If you continue to see this message, please contact support@thesmellywaterclub.com with your order details.
                  </div>
                </div>
              </div>
            )}

            {order && !loading && !error && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Order ID
                      </div>
                      <div className="font-mono text-sm text-gray-900">{order.id}</div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {statusBadge}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Package className="h-4 w-4" /> Items
                    </h2>
                    <div className="mt-3 space-y-4 text-sm text-gray-700">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.sizeMl} ml • Qty {item.quantity}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatPaise(item.lineTotalPaise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                      <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Mail className="h-4 w-4" /> Contact
                      </h2>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div>{order.guestEmail ?? email ?? "Guest Customer"}</div>
                        <div className="text-xs text-gray-500">
                          Keep this email handy to track your order.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                      <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        Payment Summary
                      </h2>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{totals?.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>{totals?.tax}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>{totals?.shipping}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span>
                          <span>-{totals?.discount}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-gray-900">
                          <span>Total Paid</span>
                          <span>{totals?.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-600">
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Mail className="h-4 w-4" /> What's next?
                  </h2>
                  <ul className="grid gap-2 md:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      You'll receive shipping updates at {email}.
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      Track your order any time using your order ID and email.
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      Use your waybill on our
                      <Link
                        href="/tracking"
                        className="font-medium text-pink-600 underline-offset-2 hover:underline"
                      >
                        tracking page
                      </Link>
                      for live courier updates.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
              <div className="text-xs text-gray-500">
                Need help? Email us at support@thesmellywaterclub.com
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">Continue shopping</Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/orders/lookup">Track another order</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
