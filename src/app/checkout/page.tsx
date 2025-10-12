"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Lock,
  Apple,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Info,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CartIndicator } from "@/components/cart-indicator";
import { AccountButton } from "@/components/account-button";
import {
  cartItemsSelector,
  useCartStore,
} from "@/lib/cart-store";
import {
  type ProductVariant,
  getPrimaryMedia,
  getProductBySlug,
  getProductVariant,
} from "@/data/products";
import { formatPaise } from "@/lib/money";

type DetailedItem = {
  key: string;
  name: string;
  variantLabel: string;
  pricePaise: number;
  qty: number;
  image: string;
};

function getVariantUnitPricePaise(variant: ProductVariant): number {
  return variant.salePaise ?? variant.mrpPaise;
}

const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/400x400.png?text=Fragrance";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore(cartItemsSelector);

  const detailedItems = useMemo<DetailedItem[]>(() => {
    return items
      .map((item) => {
        const product = getProductBySlug(item.productSlug);
        if (!product) return null;
        const variant =
          getProductVariant(product.slug, item.variantId) ??
          product.variants[0];
        if (!variant) return null;
        const media = getPrimaryMedia(product);
        return {
          key: `${product.slug}-${variant.id}`,
          name: product.title,
          variantLabel: `${variant.sizeMl} ml`,
          pricePaise: getVariantUnitPricePaise(variant),
          qty: item.qty,
          image: media?.url ?? FALLBACK_IMAGE_URL,
        };
      })
      .filter((entry): entry is DetailedItem => entry !== null);
  }, [items]);

  const subtotalPaise = useMemo(
    () => detailedItems.reduce((sum, item) => sum + item.pricePaise * item.qty, 0),
    [detailedItems]
  );
  const subtotal = subtotalPaise / 100;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [shipping, setShipping] = useState({
    name: "Jane Doe",
    phone: "+1 555-123-4567",
    line1: "123 Ocean Drive",
    line2: "",
    city: "Miami",
    state: "FL",
    zip: "33139",
    country: "USA",
    date: "",
    notes: "",
  });
  const [addressValid, setAddressValid] = useState<boolean | null>(null);

  type ShipMethod = "standard" | "express" | "overnight";
  const [shipMethod, setShipMethod] = useState<ShipMethod>("standard");
  const shipRate =
    shipMethod === "standard"
      ? 299
      : shipMethod === "express"
      ? 599
      : 999;
  const shipEta =
    shipMethod === "standard"
      ? "3–5 business days"
      : shipMethod === "express"
      ? "2–3 business days"
      : "1–2 business days";

  const [payTab, setPayTab] = useState("card");
  const [billingSame, setBillingSame] = useState(true);
  const [card, setCard] = useState({
    number: "",
    name: "",
    exp: "",
    cvc: "",
  });
  const [billing, setBilling] = useState({
    line1: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const tax = Math.round((subtotal + shipRate) * 0.18 * 100) / 100;
  const total = Math.round((subtotal + shipRate + tax) * 100) / 100;

  const estDate = useMemo(() => {
    const d = new Date();
    const add =
      shipMethod === "standard" ? 4 : shipMethod === "express" ? 3 : 2;
    d.setDate(d.getDate() + add);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [shipMethod]);

  function validateAddress() {
    const ok =
      shipping.line1.trim().length > 3 &&
      shipping.city.trim().length > 1 &&
      /\d{6}/.test(shipping.zip);
    setAddressValid(ok);
    return ok;
  }

  function goNext() {
    if (step === 1) {
      if (!validateAddress()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (payTab === "card") {
        const ok =
          card.number.replace(/\s/g, "").length >= 12 &&
          card.exp.trim().length >= 4 &&
          card.cvc.trim().length >= 3;
        if (!ok) return;
      }
      setStep(4);
    }
  }

  function goBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as typeof prev) : prev));
  }

  if (detailedItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-xl font-semibold">
              Your cart is currently empty
            </h1>
            <p className="text-sm text-gray-600">
              Add a fragrance to your cart to begin checkout.
            </p>
            <Button onClick={() => router.push("/")}>
              Browse The Smelly Water Club
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/cart")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to cart
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>SSL Secure • PCI ready</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="grid grid-cols-4 gap-2 text-xs md:text-sm">
          {["Shipping", "Method", "Payment", "Review"].map((label, index) => {
            const active = step === (index + 1);
            const done = step > (index + 1);
            return (
              <div
                key={label}
                className={cnStepper(active, done)}
              >
                {label}
              </div>
            );
          })}
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-8">
          {step === 1 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Shipping Information</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Estimated delivery:{" "}
                    <span className="font-medium">{estDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="saved-address"
                    checked={useSavedAddress}
                    onCheckedChange={(value) => setUseSavedAddress(value)}
                  />
                  <Label htmlFor="saved-address" className="text-sm">
                    Use saved address
                  </Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="ship-name">Name</Label>
                    <Input
                      id="ship-name"
                      value={shipping.name}
                      onChange={(event) =>
                        setShipping({ ...shipping, name: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-phone">Phone</Label>
                    <Input
                      id="ship-phone"
                      value={shipping.phone}
                      onChange={(event) =>
                        setShipping({ ...shipping, phone: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-line1">Address line 1</Label>
                    <Input
                      id="ship-line1"
                      value={shipping.line1}
                      onChange={(event) =>
                        setShipping({ ...shipping, line1: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-line2">Address line 2 (optional)</Label>
                    <Input
                      id="ship-line2"
                      value={shipping.line2}
                      onChange={(event) =>
                        setShipping({ ...shipping, line2: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-city">City</Label>
                    <Input
                      id="ship-city"
                      value={shipping.city}
                      onChange={(event) =>
                        setShipping({ ...shipping, city: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-state">State/Region</Label>
                    <Input
                      id="ship-state"
                      value={shipping.state}
                      onChange={(event) =>
                        setShipping({ ...shipping, state: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-zip">ZIP / PIN</Label>
                    <Input
                      id="ship-zip"
                      value={shipping.zip}
                      onChange={(event) =>
                        setShipping({ ...shipping, zip: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-country">Country</Label>
                    <Input
                      id="ship-country"
                      value={shipping.country}
                      onChange={(event) =>
                        setShipping({
                          ...shipping,
                          country: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-date">Delivery date (optional)</Label>
                    <Input
                      id="ship-date"
                      placeholder="YYYY-MM-DD"
                      value={shipping.date}
                      onChange={(event) =>
                        setShipping({ ...shipping, date: event.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-notes">Special delivery instructions</Label>
                    <Input
                      id="ship-notes"
                      placeholder="Leave at reception, call on arrival, etc."
                      value={shipping.notes}
                      onChange={(event) =>
                        setShipping({ ...shipping, notes: event.target.value })
                      }
                    />
                  </div>
                </div>

                {addressValid === false && (
                  <div className="text-sm text-rose-600">
                    Please double-check your address (ZIP and line 1 required).
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/cart")}>
                    Back to cart
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Continue to Shipping Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <h2 className="text-lg font-semibold">Shipping Method</h2>
                <RadioGroup
                  value={shipMethod}
                  onValueChange={(value) => setShipMethod(value as ShipMethod)}
                  className="space-y-3"
                >
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="standard" id="ship-standard" />
                      <div>
                        <div className="font-medium">Standard</div>
                        <div className="text-xs text-gray-600">
                          3–5 business days
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPaise(299, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="express" id="ship-express" />
                      <div>
                        <div className="font-medium">Express</div>
                        <div className="text-xs text-gray-600">
                          2–3 business days
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPaise(599, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="overnight" id="ship-overnight" />
                      <div>
                        <div className="font-medium">Overnight</div>
                        <div className="text-xs text-gray-600">
                          1–2 business days
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPaise(999, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </label>
                </RadioGroup>

                <div className="text-sm text-gray-600">
                  Estimated delivery:{" "}
                  <span className="font-medium">{estDate}</span>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Payment</h2>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Lock className="h-4 w-4" /> Secure 256-bit encryption
                  </div>
                </div>

                <Tabs
                  value={payTab}
                  onValueChange={setPayTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger
                      value="card"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet"
                      className="flex items-center gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      Wallets
                    </TabsTrigger>
                    <TabsTrigger
                      value="bnpl"
                      className="flex items-center gap-2"
                    >
                      <Badge className="border-0 bg-gray-100 text-gray-700">
                        BNPL
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="card-number">Card number</Label>
                        <Input
                          id="card-number"
                          inputMode="numeric"
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={(event) =>
                            setCard({ ...card, number: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-name">Name on card</Label>
                        <Input
                          id="card-name"
                          value={card.name}
                          onChange={(event) =>
                            setCard({ ...card, name: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-exp">Expiry (MM/YY)</Label>
                        <Input
                          id="card-exp"
                          placeholder="MM/YY"
                          value={card.exp}
                          onChange={(event) =>
                            setCard({ ...card, exp: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-cvc">CVC</Label>
                        <Input
                          id="card-cvc"
                          inputMode="numeric"
                          placeholder="123"
                          value={card.cvc}
                          onChange={(event) =>
                            setCard({ ...card, cvc: event.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Checkbox
                        id="billing-same"
                        checked={billingSame}
                        onCheckedChange={(value) => setBillingSame(value)}
                      />
                      <Label htmlFor="billing-same" className="text-sm">
                        Billing address same as shipping
                      </Label>
                    </div>

                    {!billingSame && (
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor="bill-line1">Address line 1</Label>
                          <Input
                            id="bill-line1"
                            value={billing.line1}
                            onChange={(event) =>
                              setBilling({
                                ...billing,
                                line1: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="bill-city">City</Label>
                          <Input
                            id="bill-city"
                            value={billing.city}
                            onChange={(event) =>
                              setBilling({
                                ...billing,
                                city: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="bill-state">State</Label>
                          <Input
                            id="bill-state"
                            value={billing.state}
                            onChange={(event) =>
                              setBilling({
                                ...billing,
                                state: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="bill-zip">ZIP</Label>
                          <Input
                            id="bill-zip"
                            value={billing.zip}
                            onChange={(event) =>
                              setBilling({
                                ...billing,
                                zip: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="bill-country">Country</Label>
                          <Input
                            id="bill-country"
                            value={billing.country}
                            onChange={(event) =>
                              setBilling({
                                ...billing,
                                country: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="wallet" className="mt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        className="h-11 justify-center gap-2"
                      >
                        <Apple className="h-5 w-5" />
                        Apple Pay
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 justify-center gap-2"
                      >
                        <Wallet className="h-5 w-5" />
                        Google Pay
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 justify-center gap-2"
                      >
                        PayPal
                      </Button>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Digital wallet options are shown based on your device and
                      browser support.
                    </div>
                  </TabsContent>

                  <TabsContent value="bnpl" className="mt-4">
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        Split your purchase into 4 interest-free payments.
                      </div>
                      <div className="text-xs text-gray-500">
                        Subject to eligibility; provider T&amp;Cs apply.
                      </div>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <Button variant="outline" className="h-11">
                          Klarna
                        </Button>
                        <Button variant="outline" className="h-11">
                          Affirm
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={goNext}
                  >
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-6 p-4 md:p-6">
                <h2 className="text-lg font-semibold">Review &amp; Confirm</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-1 font-medium">Shipping to</h3>
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">
                        {shipping.name} • {shipping.phone}
                      </div>
                      <div>
                        {shipping.line1}
                        {shipping.line2 ? `, ${shipping.line2}` : ""}
                      </div>
                      <div>
                        {shipping.city}, {shipping.state} {shipping.zip}
                      </div>
                      <div>{shipping.country}</div>
                      {shipping.notes && (
                        <div className="mt-1 text-gray-500">
                          Note: {shipping.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-medium">Delivery</h3>
                    <div className="text-sm text-gray-700">
                      {shipMethod.toUpperCase()} • {shipEta} • ETA{" "}
                      <span className="font-medium">{estDate}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-2 font-medium">Items</h3>
                  <div className="space-y-3">
                    {detailedItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.variantLabel} • Qty {item.qty}
                          </div>
                        </div>
                        <div className="font-semibold">
                          {formatPaise(item.pricePaise * item.qty, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="order-terms" />
                  <Label htmlFor="order-terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="#" className="underline">
                      Terms &amp; Conditions
                    </Link>
                    .
                  </Label>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    Back
                  </Button>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Place Order
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Info className="h-4 w-4" />
                  By placing your order, you confirm you’ve reviewed shipping
                  dates, prices, and returns policy.
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="lg:col-span-4">
          <Card className="rounded-2xl lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-4 md:p-6">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPaise(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPaise(shipRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>{formatPaise(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPaise(total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Payments processed with PCI DSS compliant gateways
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-2xl">
            <CardContent className="p-4 md:p-6 text-sm text-gray-700">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Truck className="h-4 w-4" />
                Address validation
              </div>
              <div
                className={`text-xs ${
                  addressValid === false ? "text-rose-600" : "text-gray-600"
                }`}
              >
                We’ll validate your address in real-time at purchase. Invalid
                addresses may delay delivery.
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

function cnStepper(active: boolean, done: boolean) {
  if (active) {
    return "rounded-full border border-pink-600 px-3 py-2 text-center text-pink-700";
  }
  if (done) {
    return "rounded-full border border-emerald-500 px-3 py-2 text-center text-emerald-700";
  }
  return "rounded-full border border-gray-200 px-3 py-2 text-center text-gray-600";
}
