"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSellerOffers,
  upsertSellerOffer,
  SellerApiError,
  type SellerOffer,
} from "@/data/seller";
import { formatINR } from "@/lib/money";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SellerOffersPage() {
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSellerOffers();
      setOffers(data);
    } catch (apiError) {
      if (apiError instanceof SellerApiError) {
        setError(apiError.message);
      } else {
        setError("Unable to load offers. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const handleToggleActive = async (offer: SellerOffer, nextActive: boolean) => {
    setActionId(offer.id);
    setError(null);
    try {
      const result = await upsertSellerOffer({
        offerId: offer.id,
        variantId: offer.variant.id,
        sellerLocationId: offer.location.id,
        partnerSku: offer.partnerSku ?? undefined,
        price: offer.price,
        shipping: offer.shipping,
        stockQty: offer.stockQty,
        mrp: offer.mrp ?? null,
        isActive: nextActive,
        condition: offer.condition,
        authGrade: offer.authGrade,
        expiresAt: offer.expiresAt ?? null,
      });
      setOffers((previous) =>
        previous.map((item) => (item.id === offer.id ? result.offer : item))
      );
    } catch (apiError) {
      if (apiError instanceof SellerApiError) {
        setError(apiError.message);
      } else {
        setError("Unable to update offer. Please try again.");
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Offer management
          </h1>
          <p className="text-sm text-slate-500">
            Update pricing, stock, and availability for each listing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/seller/offers/new">Add offer</Link>
          </Button>
          <Button variant="outline" onClick={() => loadOffers()}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : offers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No offers yet. Create your first offer to start selling.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Pricing</th>
                    <th className="px-4 py-3">Inventory</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {offers.map((offer) => {
                    const isBusy = actionId === offer.id;
                    return (
                      <tr key={offer.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {offer.variant.product.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {offer.variant.sizeMl} ml · SKU {offer.variant.sku}
                          </div>
                          <div
                            className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              offer.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {offer.isActive ? "Active" : "Inactive"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div>
                            {formatINR(offer.price, {
                              minimumFractionDigits: 0,
                            })}
                          </div>
                          <div className="text-xs text-slate-500">
                            Shipping:{" "}
                            {formatINR(offer.shipping, {
                              minimumFractionDigits: 0,
                            })}
                          </div>
                          {offer.mrp ? (
                            <div className="text-xs text-slate-500">
                              MRP:{" "}
                              {formatINR(offer.mrp, {
                                minimumFractionDigits: 0,
                              })}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div>{offer.stockQty} units</div>
                          <div className="text-xs text-slate-500">
                            Condition: {offer.condition.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-slate-500">
                            Auth: {offer.authGrade.replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div className="font-medium text-slate-900">
                            {offer.location.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {offer.location.city}, {offer.location.state}
                          </div>
                          <div className="text-xs text-slate-500">
                            Pickup: {offer.location.delhiveryPickupCode}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatDateTime(offer.updatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Link href={`/seller/offers/new?offerId=${offer.id}`}>
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant={offer.isActive ? "outline" : "secondary"}
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                handleToggleActive(offer, !offer.isActive)
                              }
                            >
                              {isBusy
                                ? "Saving…"
                                : offer.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
