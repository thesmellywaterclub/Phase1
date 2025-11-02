"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PackageSearch,
  Loader2,
  MapPin,
  Clock,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchShipmentTracking, type TrackingResult } from "@/data/shipments";

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return null;
  }
}

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const [waybill, setWaybill] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);

  const currentWaybill = useMemo(() => searchParams.get("waybill") ?? "", [searchParams]);

  const handleLookup = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setTracking(null);
      setError("Enter a valid tracking number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchShipmentTracking(trimmed);
      setTracking(result);
    } catch (requestError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[tracking] lookup failed", requestError);
      }
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not fetch tracking details. Please try again.";
      setError(message);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentWaybill) {
      return;
    }
    setWaybill(currentWaybill);
    void handleLookup(currentWaybill);
  }, [currentWaybill, handleLookup]);

  const latestEvent = tracking?.events?.[0] ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
            </Link>
          </Button>
          <div className="ml-auto text-xs uppercase tracking-[0.3em] text-gray-500">
            Track your order
          </div>
        </div>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageSearch className="h-5 w-5 text-pink-500" />
              Delhivery tracking
            </CardTitle>
            <p className="text-sm text-gray-600">
              Enter the tracking ID (waybill) from your order confirmation email to
              view the latest courier updates.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void handleLookup(waybill);
              }}
            >
              <Input
                value={waybill}
                onChange={(event) => setWaybill(event.target.value)}
                placeholder="Enter your waybill / tracking number"
                className="flex-1"
                aria-label="Tracking number"
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Track package
              </Button>
            </form>

            {error ? (
              <div className="mt-3 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            {tracking ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <MapPin className="h-4 w-4 text-pink-500" />
                      {tracking.currentStatus}
                    </div>
                    {formatDateTime(tracking.currentStatusDate) ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(tracking.currentStatusDate)}
                      </div>
                    ) : null}
                    <div className="ml-auto text-xs text-gray-500">
                      Waybill: <span className="font-mono">{tracking.waybill}</span>
                    </div>
                  </div>
                  {latestEvent?.location ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Last seen at {latestEvent.location}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Tracking timeline</h3>
                  <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 text-sm">
                    {tracking.events.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        We have not received any scan updates yet. Check again in a little while.
                      </p>
                    ) : (
                      tracking.events.map((event, index) => {
                        const timestamp = formatDateTime(event.timestamp);
                        const isLatest = index === 0;
                        return (
                          <div
                            key={`${event.status}-${event.timestamp ?? index}`}
                            className="border-l-2 border-gray-200 pl-3"
                          >
                            <div className="ml-[-13px] flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isLatest ? "bg-pink-500" : "bg-gray-300"
                                }`}
                                aria-hidden="true"
                              />
                              <span className={`text-xs font-semibold ${isLatest ? "text-pink-600" : "text-gray-600"}`}>
                                {event.status}
                              </span>
                            </div>
                            <div className="ml-3 mt-1 text-xs text-gray-500">
                              {timestamp ?? "Time pending"}
                            </div>
                            {event.location ? (
                              <div className="ml-3 text-xs text-gray-600">
                                {event.location}
                              </div>
                            ) : null}
                            {event.remarks ? (
                              <div className="ml-3 text-[0.7rem] text-gray-500">
                                {event.remarks}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          Need help? Email <a className="font-medium text-pink-600" href="mailto:support@thesmellywaterclub.com">support@thesmellywaterclub.com</a>
          <span className="hidden md:inline">•</span>
          <span className="block md:inline">Delhivery updates refresh every few minutes.</span>
        </div>
      </div>
    </div>
  );
}
