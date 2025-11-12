"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  registerSellerAccount,
  SellerApiError,
  type SellerRegistrationInput,
} from "@/data/seller";
import { ApiError } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";

type SellerRegistrationFormValues = {
  legalName: string;
  displayName: string;
  businessEmail: string;
  businessPhone: string;
  gstNumber: string;
  panNumber: string;
  locationLabel: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  delhiveryPickupCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  acceptTerms: boolean;
};

function buildRegistrationPayload(
  values: SellerRegistrationFormValues
): SellerRegistrationInput {
  return {
    business: {
      legalName: values.legalName.trim(),
      displayName: values.displayName.trim(),
      email: values.businessEmail.trim() || undefined,
      phone: values.businessPhone.trim() || undefined,
      gstNumber: values.gstNumber.trim() || undefined,
      panNumber: values.panNumber.trim() || undefined,
    },
    pickup: {
      label: values.locationLabel.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      country: values.country.trim() || undefined,
      pincode: values.pincode.trim(),
      delhiveryPickupCode: values.delhiveryPickupCode.trim(),
      contactName: values.contactName.trim(),
      contactPhone: values.contactPhone.trim(),
      contactEmail: values.contactEmail.trim() || undefined,
    },
    acceptTerms: values.acceptTerms,
  };
}

export default function SellerRegistrationPage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);

  const defaultValues = useMemo<SellerRegistrationFormValues>(
    () => ({
      legalName: authUser?.name ?? "",
      displayName: authUser?.name ?? "",
      businessEmail: authUser?.email ?? "",
      businessPhone: authUser?.phone ?? "",
      gstNumber: "",
      panNumber: "",
      locationLabel: "Primary Warehouse",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      delhiveryPickupCode: "",
      contactName: authUser?.name ?? "",
      contactPhone: authUser?.phone ?? "",
      contactEmail: authUser?.email ?? "",
      acceptTerms: false,
    }),
    [authUser]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SellerRegistrationFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!token) {
      router.replace("/login?next=/seller/register");
    }
  }, [router, token]);

  useEffect(() => {
    if (authUser?.sellerId) {
      router.replace("/seller");
    }
  }, [authUser?.sellerId, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!values.acceptTerms) {
      setSubmitError("You must accept the seller terms to continue.");
      return;
    }

    try {
      const payload = buildRegistrationPayload(values);
      const result = await registerSellerAccount(payload, token ?? undefined);

      const updated: AuthUser = {
        id: result.user.id,
        name: result.user.fullName,
        email: result.user.email,
        avatarUrl: result.user.avatarUrl,
        phone: result.user.phone,
        isSeller: result.user.isSeller,
        isAdmin: result.user.isAdmin,
        clubMember: result.user.clubMember,
        clubVerified: result.user.clubVerified,
        sellerId: result.user.sellerId,
      };

      updateUser(updated);
      setDidSubmit(true);
      router.replace("/seller");
    } catch (error) {
      console.error("Seller registration failed", error);
      if (error instanceof SellerApiError) {
        setSubmitError(error.message);
      } else if (error instanceof ApiError) {
        const message =
          (error.body as { error?: { message?: string } } | null)?.error?.message;
        setSubmitError(message ?? "Registration failed. Please try again.");
      } else {
        setSubmitError("Registration failed. Please try again.");
      }
    }
  });

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Back to storefront
          </Link>
        </div>
        <Card>
          <CardContent className="space-y-8 p-8">
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                Become a Smelly Water Club seller
              </h1>
              <p className="text-sm text-slate-500">
                Tell us about your business and primary dispatch location. Our
                operations team will verify the details and enable seller tools
                for you.
              </p>
            </header>

            {submitError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            {didSubmit ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Registration submitted! Redirecting to your seller dashboard…
              </div>
            ) : null}

            <form className="space-y-8" onSubmit={onSubmit} noValidate>
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Business details
                  </h2>
                  <p className="text-sm text-slate-500">
                    These details appear on invoices and customer communication.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal business name</Label>
                    <Input
                      id="legalName"
                      {...register("legalName", {
                        required: "Enter your legal business name",
                      })}
                    />
                    {errors.legalName && (
                      <p className="text-xs text-rose-600">
                        {errors.legalName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Storefront name</Label>
                    <Input
                      id="displayName"
                      {...register("displayName", {
                        required: "Enter a public-facing name",
                      })}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-rose-600">
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      {...register("businessEmail", {
                        required: "Enter a business email",
                      })}
                    />
                    {errors.businessEmail && (
                      <p className="text-xs text-rose-600">
                        {errors.businessEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business phone</Label>
                    <Input
                      id="businessPhone"
                      {...register("businessPhone", {
                        required: "Enter a contact phone number",
                      })}
                    />
                    {errors.businessPhone && (
                      <p className="text-xs text-rose-600">
                        {errors.businessPhone.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST number (optional)</Label>
                    <Input id="gstNumber" {...register("gstNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN number (optional)</Label>
                    <Input id="panNumber" {...register("panNumber")} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Primary pickup location
                  </h2>
                  <p className="text-sm text-slate-500">
                    Provide the warehouse or store Delhivery will pick orders
                    from.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="locationLabel">Location label</Label>
                    <Input
                      id="locationLabel"
                      {...register("locationLabel", {
                        required: "Add a label for this location",
                      })}
                    />
                    {errors.locationLabel && (
                      <p className="text-xs text-rose-600">
                        {errors.locationLabel.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delhiveryPickupCode">
                      Delhivery pickup code
                    </Label>
                    <Input
                      id="delhiveryPickupCode"
                      {...register("delhiveryPickupCode", {
                        required: "Enter the Delhivery pickup code assigned to you",
                      })}
                    />
                    {errors.delhiveryPickupCode && (
                      <p className="text-xs text-rose-600">
                        {errors.delhiveryPickupCode.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address line 1</Label>
                  <Input
                    id="addressLine1"
                    {...register("addressLine1", {
                      required: "Enter the address",
                    })}
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-rose-600">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address line 2</Label>
                    <Input id="addressLine2" {...register("addressLine2")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register("country")} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city", { required: "Enter the city name" })}
                    />
                    {errors.city && (
                      <p className="text-xs text-rose-600">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register("state", {
                        required: "Enter the state / region",
                      })}
                    />
                    {errors.state && (
                      <p className="text-xs text-rose-600">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      {...register("pincode", {
                        required: "Enter the pincode",
                      })}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-rose-600">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Pickup contact name</Label>
                    <Input
                      id="contactName"
                      {...register("contactName", {
                        required: "Enter an on-site contact name",
                      })}
                    />
                    {errors.contactName && (
                      <p className="text-xs text-rose-600">
                        {errors.contactName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Pickup contact phone</Label>
                    <Input
                      id="contactPhone"
                      {...register("contactPhone", {
                        required: "Enter an on-site phone number",
                      })}
                    />
                    {errors.contactPhone && (
                      <p className="text-xs text-rose-600">
                        {errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Pickup contact email</Label>
                  <Input id="contactEmail" {...register("contactEmail")} />
                </div>
              </section>

              <section className="space-y-3">
                <Controller
                  control={control}
                  name="acceptTerms"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <label className="flex items-start gap-3 text-sm text-slate-600">
                      <Checkbox
                        id="acceptTerms"
                        checked={field.value}
                        onCheckedChange={(value) =>
                          field.onChange(value === true)
                        }
                      />
                      <span>
                        I confirm that the above details are accurate and agree
                        to the Smelly Water Club seller terms and logistics
                        policies.
                      </span>
                    </label>
                  )}
                />
                {errors.acceptTerms && (
                  <p className="text-xs text-rose-600">
                    Please accept the terms to continue.
                  </p>
                )}
              </section>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Submit registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
