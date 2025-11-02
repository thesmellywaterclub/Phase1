"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSellerLocations,
  SellerApiError,
  type SellerLocation,
} from "@/data/seller";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusStyles(status: SellerLocation["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "SUSPENDED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function SellerLocationsPage() {
  const [locations, setLocations] = useState<SellerLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSellerLocations();
      setLocations(data);
    } catch (apiError) {
      if (apiError instanceof SellerApiError) {
        setError(apiError.message);
      } else {
        setError("Unable to load pickup locations. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Pickup locations
          </h1>
          <p className="text-sm text-slate-500">
            Verified locations ensure smooth Delhivery pickups for every order.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadLocations()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          </>
        ) : locations.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="space-y-2 p-6 text-sm text-slate-600">
              <p>No pickup locations on file yet.</p>
              <p>
                Reach out to the Smelly Water operations team to onboard your
                warehouse and start fulfilling orders.
              </p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {location.label}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {location.delhiveryPickupCode}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles(
                      location.status
                    )}`}
                  >
                    {location.status === "UNVERIFIED"
                      ? "Pending verification"
                      : location.status === "ACTIVE"
                        ? "Active"
                        : "Suspended"}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  <p>
                    {location.address1}
                    {location.address2 ? `, ${location.address2}` : ""}
                  </p>
                  <p>
                    {location.city}, {location.state} · {location.pincode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <p className="font-medium text-slate-700">
                      Contact person
                    </p>
                    <p>
                      {location.contactName ?? "—"}
                      {location.contactPhone
                        ? ` · ${location.contactPhone}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      Last verified
                    </p>
                    <p>{formatDate(location.lastVerifiedAt)}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Delhivery status:{" "}
                  {location.delhiveryVerified ? "Verified" : "Not verified"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
