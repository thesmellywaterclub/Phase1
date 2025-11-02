"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CatalogVariantSearchItem,
  getCatalogVariants,
  getSellerLocations,
  getSellerOffers,
  upsertSellerOffer,
  SellerApiError,
  type SellerLocation,
  type SellerOffer,
  type SellerOfferAuthGrade,
  type SellerOfferCondition,
} from "@/data/seller";

type VariantOption = {
  id: string;
  label: string;
  sku: string;
  sizeMl: number;
  productTitle: string;
  brandName: string;
};

type OfferFormValues = {
  variantId: string;
  sellerLocationId: string;
  partnerSku: string;
  price: number;
  shipping: number;
  stockQty: number;
  mrp: string;
  isActive: boolean;
  condition: SellerOfferCondition;
  authGrade: SellerOfferAuthGrade;
  expiresAt: string;
};

function mapVariantOptionFromCatalog(
  variant: CatalogVariantSearchItem
): VariantOption {
  return {
    id: variant.id,
    sku: variant.sku,
    sizeMl: variant.sizeMl,
    productTitle: variant.product.title,
    brandName: variant.product.brand.name,
    label: `${variant.product.title} · ${variant.sizeMl}ml · ${variant.sku}`,
  };
}

function mapVariantOptionFromOffer(offer: SellerOffer): VariantOption {
  return {
    id: offer.variant.id,
    sku: offer.variant.sku,
    sizeMl: offer.variant.sizeMl,
    productTitle: offer.variant.product.title,
    brandName: offer.variant.product.brand.name,
    label: `${offer.variant.product.title} · ${offer.variant.sizeMl}ml · ${offer.variant.sku}`,
  };
}

function toLocalDateInput(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function UpsertSellerOfferPage() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId");
  const isEditing = Boolean(offerId);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    defaultValues: {
      variantId: "",
      sellerLocationId: "",
      partnerSku: "",
      price: 0,
      shipping: 0,
      stockQty: 1,
      mrp: "",
      isActive: true,
      condition: "NEW",
      authGrade: "SEALED",
      expiresAt: "",
    },
  });

  const [locations, setLocations] = useState<SellerLocation[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null
  );
  const [catalogVariants, setCatalogVariants] = useState<CatalogVariantSearchItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const hasLocations = locations.length > 0;

  const loadInitialData = useCallback(async () => {
    setPageError(null);
    setIsInitializing(true);

    try {
      const [locationsData, variantsData, offersData] = await Promise.all([
        getSellerLocations(),
        getCatalogVariants(),
        offerId ? getSellerOffers() : Promise.resolve<SellerOffer[]>([]),
      ]);

      setLocations(locationsData);
      setCatalogVariants(variantsData);

      if (!offerId && locationsData.length) {
        setValue("sellerLocationId", locationsData[0].id);
      }

      if (offerId) {
        const existing = offersData.find((offer) => offer.id === offerId);
        if (!existing) {
          setPageError("Offer not found or no longer available.");
          return;
        }

        const variantOption = mapVariantOptionFromOffer(existing);
        setSelectedVariant(variantOption);

        reset({
          variantId: existing.variant.id,
          sellerLocationId: existing.location.id,
          partnerSku: existing.partnerSku ?? "",
          price: existing.price,
          shipping: existing.shipping,
          stockQty: existing.stockQty,
          mrp: existing.mrp !== null ? String(existing.mrp) : "",
          isActive: existing.isActive,
          condition: existing.condition,
          authGrade: existing.authGrade,
          expiresAt: toLocalDateInput(existing.expiresAt),
        });
      } else if (variantsData.length) {
        setValue("variantId", variantsData[0].id);
      }
    } catch (error) {
      if (error instanceof SellerApiError) {
        setPageError(error.message);
      } else {
        setPageError("Unable to load seller data. Please try again.");
      }
    } finally {
      setIsInitializing(false);
    }
  }, [offerId, reset, setValue]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const variantIdValue = watch("variantId");
  useEffect(() => {
    if (!variantIdValue) {
      setSelectedVariant(null);
      return;
    }
    const found =
      catalogVariants.find((variant) => variant.id === variantIdValue) ?? null;
    if (found) {
      setSelectedVariant(mapVariantOptionFromCatalog(found));
    } else if (offerId && selectedVariant?.id === variantIdValue) {
      // keep existing selection when editing
      return;
    } else {
      setSelectedVariant(null);
    }
  }, [catalogVariants, variantIdValue, offerId, selectedVariant?.id]);

  const variantOptions = useMemo(() => {
    return catalogVariants.map(mapVariantOptionFromCatalog);
  }, [catalogVariants]);

  const variantGroups = useMemo(() => {
    const groups = new Map<string, VariantOption[]>();
    variantOptions.forEach((option) => {
      const key = option.brandName;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(option);
    });
    return Array.from(groups.entries()).map(([brand, options]) => ({
      brand,
      options,
    }));
  }, [variantOptions]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!selectedVariant) {
      setSubmitError("Select a product variant before submitting the form.");
      return;
    }

    if (!values.sellerLocationId) {
      setSubmitError("Select a pickup location.");
      return;
    }

    try {
      const payload = {
        offerId: offerId ?? undefined,
        variantId: selectedVariant.id,
        sellerLocationId: values.sellerLocationId,
        partnerSku: values.partnerSku.trim()
          ? values.partnerSku.trim()
          : undefined,
        price: values.price,
        shipping: values.shipping,
        stockQty: values.stockQty,
        mrp: values.mrp.trim() ? Number(values.mrp) : null,
        isActive: values.isActive,
        condition: values.condition,
        authGrade: values.authGrade,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
      };

      await upsertSellerOffer(payload);
      router.replace("/seller/offers");
    } catch (error) {
      if (error instanceof SellerApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Unable to save the offer. Please try again.");
      }
    }
  });

  const variantSummary = useMemo(() => {
    if (!selectedVariant) {
      return null;
    }
    return `${selectedVariant.productTitle} · ${selectedVariant.sizeMl}ml · ${selectedVariant.sku}`;
  }, [selectedVariant]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit offer" : "Create offer"}
          </h1>
          <p className="text-sm text-slate-500">
            Link a product variant to your pickup location with the right price
            and stock.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/seller/offers">Back to offers</Link>
        </Button>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {!hasLocations && !isInitializing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No pickup locations found.{" "}
          <Link
            href="/seller/locations"
            className="font-medium underline underline-offset-2"
          >
            Add and verify a location
          </Link>{" "}
          before publishing offers.
        </div>
      ) : null}

      <Card>
        <CardContent className="p-6">
          {isInitializing ? (
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : (
            <form className="space-y-8" onSubmit={onSubmit}>
              <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="variantId">Variant</Label>
                    <select
                      id="variantId"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      {...register("variantId", {
                        required: "Select a product variant",
                      })}
                    >
                      <option value="">Select a variant</option>
                      {variantGroups.map((group) => (
                        <optgroup key={group.brand} label={group.brand}>
                          {group.options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.productTitle} · {option.sizeMl}ml · {option.sku}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.variantId ? (
                      <p className="text-xs text-rose-600">
                        {errors.variantId.message}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Choose a catalog variant. Options are grouped by brand.
                      </p>
                    )}
                    {variantSummary ? (
                      <p className="text-xs text-slate-500">
                        Selected: {variantSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellerLocationId">Pickup location</Label>
                    <select
                      id="sellerLocationId"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      {...register("sellerLocationId", { required: true })}
                      disabled={!hasLocations}
                    >
                      <option value="" disabled>
                        {hasLocations
                          ? "Select a pickup location"
                          : "No locations available"}
                      </option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.label} · {location.city}
                        </option>
                      ))}
                    </select>
                    {errors.sellerLocationId ? (
                      <p className="text-xs text-rose-600">
                        Select a pickup location.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min={1}
                      step="1"
                      {...register("price", { valueAsNumber: true, min: 1 })}
                    />
                    {errors.price ? (
                      <p className="text-xs text-rose-600">
                        Enter a valid price.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Final selling price in INR.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Shipping fee</Label>
                    <Input
                      id="shipping"
                      type="number"
                      min={0}
                      step="1"
                      {...register("shipping", {
                        valueAsNumber: true,
                        min: 0,
                      })}
                    />
                    <p className="text-xs text-slate-500">
                      Optional shipping fee (₹0 for free shipping).
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stockQty">Available stock</Label>
                    <Input
                      id="stockQty"
                      type="number"
                      min={0}
                      step="1"
                      {...register("stockQty", {
                        valueAsNumber: true,
                        min: 0,
                      })}
                    />
                    <p className="text-xs text-slate-500">
                      Live stock available for sale.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (optional)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      min={0}
                      step="1"
                      {...register("mrp")}
                    />
                    <p className="text-xs text-slate-500">
                      Reference MRP shown on PDP (leave blank to skip).
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    {...register("condition")}
                  >
                    <option value="NEW">New / Sealed</option>
                    <option value="OPEN_BOX">Open box</option>
                    <option value="TESTER">Tester</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authGrade">Authentication grade</Label>
                  <select
                    id="authGrade"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    {...register("authGrade")}
                  >
                    <option value="SEALED">Brand sealed</option>
                    <option value="STORE_BILL">Store bill</option>
                    <option value="VERIFIED_UNKNOWN">Verified unknown</option>
                  </select>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partnerSku">Partner SKU (optional)</Label>
                  <Input
                    id="partnerSku"
                    placeholder="Your internal SKU"
                    {...register("partnerSku")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires at (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...register("expiresAt")}
                  />
                </div>
              </section>

              <section className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Activate offer
                  </p>
                  <p className="text-xs text-slate-500">
                    Inactive offers stay hidden from PDP and search results.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </section>

              {submitError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !hasLocations}>
                  {isSubmitting
                    ? isEditing
                      ? "Saving…"
                      : "Publishing…"
                    : isEditing
                      ? "Save changes"
                      : "Publish offer"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
