"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSellerLocations,
  getSellerOffers,
  SellerApiError,
  type SellerLocation,
  type SellerOffer,
} from "@/data/seller";
import { formatINR } from "@/lib/money";

type SellerStats = {
  activeOffers: number;
  inactiveOffers: number;
  totalStock: number;
};

function computeStats(offers: SellerOffer[]): SellerStats {
  return offers.reduce<SellerStats>(
    (accumulator, offer) => {
      if (offer.isActive) {
        accumulator.activeOffers += 1;
      } else {
        accumulator.inactiveOffers += 1;
      }
      accumulator.totalStock += offer.stockQty;
      return accumulator;
    },
    { activeOffers: 0, inactiveOffers: 0, totalStock: 0 }
  );
}

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

export default function SellerDashboardPage() {
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [locations, setLocations] = useState<SellerLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [offersData, locationsData] = await Promise.all([
        getSellerOffers(),
        getSellerLocations(),
      ]);
      setOffers(offersData);
      setLocations(locationsData);
    } catch (apiError) {
      if (apiError instanceof SellerApiError) {
        setError(apiError.message);
      } else {
        setError("Unable to load seller data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => computeStats(offers), [offers]);

  const latestOffers = useMemo(() => {
    return [...offers]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5);
  }, [offers]);

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-start justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => loadData()}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">At a glance</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm text-slate-500">Active offers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {isLoading ? "…" : stats.activeOffers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm text-slate-500">Inactive offers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {isLoading ? "…" : stats.inactiveOffers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm text-slate-500">Available stock</p>
              <p className="text-2xl font-semibold text-slate-900">
                {isLoading ? "…" : stats.totalStock}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm text-slate-500">Pickup locations</p>
              <p className="text-2xl font-semibold text-slate-900">
                {isLoading ? "…" : locations.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/seller/offers/new">Add offer</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/seller/offers">Manage offers</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/seller/locations">Verify locations</Link>
          </Button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Latest updates
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/offers">View all</Link>
          </Button>
        </div>

        <Card className="mt-4">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : latestOffers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No offers yet. Create your first offer to get started.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {latestOffers.map((offer) => (
                  <li key={offer.id} className="p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {offer.variant.product.title} · {offer.variant.sizeMl}
                          ml
                        </p>
                        <p className="text-xs text-slate-500">
                          SKU {offer.variant.sku} · Updated{" "}
                          {formatDateTime(offer.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium text-slate-900">
                          {formatINR(offer.effectivePrice, {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                        <span className="text-slate-500">
                          {offer.stockQty} in stock
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            offer.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {offer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
