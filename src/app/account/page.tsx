"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Plus,
  Mail,
  Phone,
  Lock,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  fetchCustomerProfile,
  type CustomerProfileData,
} from "@/data/customer";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";

export default function CustomerProfilePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    if (!user || !token) {
      if (!user) {
        router.replace("/login?next=/account");
      }
      return () => {
        ignore = true;
      };
    }

    setLoading(true);

    fetchCustomerProfile(token)
      .then((data) => {
        if (ignore) {
          return;
        }

        const shouldOverrideProfile =
          data.profile.email !== user.email || data.profile.name !== user.name;

        const merged: CustomerProfileData = shouldOverrideProfile
          ? {
              ...data,
              profile: {
                ...data.profile,
                name: user.name,
                email: user.email,
              },
            }
          : data;

        setCustomer(merged);
        setLoading(false);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          logout();
          router.replace("/login?next=/account");
          return;
        }

        if (process.env.NODE_ENV !== "production") {
          console.error("[account] Failed to load customer profile", error);
        }
        setCustomer(null);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user, token, router, logout]);

  const updatePreferences = (partial: Partial<CustomerProfileData["preferences"]>) => {
    setCustomer((prev) =>
      prev
        ? {
            ...prev,
            preferences: { ...prev.preferences, ...partial },
          }
        : prev
    );
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6 text-center text-sm text-gray-600">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <p>Redirecting to sign in…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6 text-center text-sm text-gray-600">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <p>Loading your account details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, addresses, orders, paymentMethods, preferences } = customer;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-sm text-gray-600 hover:text-gray-900"
              onClick={() => router.push("/")}
            >
              ← Back to home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Signed in as{" "}
              <span className="font-medium text-gray-900">{user.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 rounded-2xl bg-gray-100 p-1">
            <TabsTrigger value="profile">Personal Info</TabsTrigger>
            <TabsTrigger value="addresses">Address Book</TabsTrigger>
            <TabsTrigger value="orders">Orders &amp; Tracking</TabsTrigger>
            <TabsTrigger value="payments">Payment Details</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 text-lg">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Picture
                    </Button>
                    <div className="mt-2 text-xs text-gray-500">
                      PNG/JPG up to 2MB
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={profile.name} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue={profile.email}
                      type="email"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={profile.phone} className="mt-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Password</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <span
                    className={`text-sm font-medium ${
                      profile.verified ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {profile.verified ? "Account Verified" : "Verification Pending"}
                  </span>
                </div>

                <div className="pt-4">
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </Button>
                </div>

                {addresses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {addresses.map((addr) => (
                      <Card
                        key={addr.id}
                        className={`rounded-xl border ${
                          addr.default ? "border-pink-600" : "border-gray-200"
                        }`}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {addr.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {addr.line1}, {addr.city}
                                {addr.zip ? `, ${addr.zip}` : ""}
                              </p>
                              <p className="text-xs text-gray-500">{addr.country || "—"}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" aria-label="Edit address">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Delete address"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          {addr.default ? (
                            <span className="text-xs font-medium text-pink-600">
                              Default {addr.type} Address
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                            >
                              Set as Default
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center text-sm text-gray-500">
                    No addresses saved yet. Complete a checkout to store your preferred shipping details.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-6 p-6">
                <h2 className="mb-4 text-xl font-semibold">My Orders</h2>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const statusLower = order.status.toLowerCase();
                    const statusColor =
                      statusLower === "delivered"
                        ? "text-emerald-600"
                        : statusLower === "cancelled" || statusLower.includes("refund")
                        ? "text-rose-600"
                        : "text-amber-600";
                    const tracking = order.tracking;
                    const hasTrackingDetails = Boolean(
                      tracking.id ||
                        tracking.carrier ||
                        tracking.currentLocation ||
                        tracking.expectedDelivery ||
                        tracking.status,
                    );

                    return (
                      <div key={order.id} className="mb-6 border-b pb-6 last:border-0">
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">Order ID: {order.id}</p>
                            <p className="text-sm text-gray-500">
                              Placed on {order.date}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="mb-3 text-sm text-gray-700">
                          <p>
                            Total:{" "}
                            <span className="font-semibold">{order.total}</span>
                          </p>
                        </div>

                        <div className="mb-3">
                          <h4 className="mb-2 flex items-center gap-2 font-medium">
                            <Package className="h-4 w-4" />
                            Items
                          </h4>
                          <ul className="list-inside list-disc text-sm text-gray-600">
                            {order.items.map((item, idx) => (
                              <li key={`${order.id}-item-${idx}`}>
                                {item.name} x{item.qty}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="mb-2 flex items-center gap-2 font-medium">
                            <Truck className="h-4 w-4" />
                            Tracking
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              Status:{" "}
                              <span className="font-medium">
                                {tracking.status ?? order.status}
                              </span>
                            </p>
                            {tracking.id ? <p>Tracking ID: {tracking.id}</p> : null}
                            {tracking.carrier ? (
                              <p>Carrier: {tracking.carrier}</p>
                            ) : null}
                            {tracking.currentLocation ? (
                              <p>Last update: {tracking.currentLocation}</p>
                            ) : null}
                            {tracking.expectedDelivery ? (
                              <p>
                                Expected Delivery: {tracking.expectedDelivery}
                              </p>
                            ) : null}
                            {!hasTrackingDetails ? (
                              <p className="text-gray-500">
                                Tracking details will appear once the shipment is created.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center text-sm text-gray-500">
                    You haven&apos;t placed any orders yet. Visit the collection to get started.
                  </div>
                )}
             </CardContent>
           </Card>
         </TabsContent>

          <TabsContent value="payments">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <CreditCard className="h-5 w-5" />
                    Saved Payment Methods
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </Button>
                </div>

                {paymentMethods.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {paymentMethods.map((method) => (
                      <Card
                        key={method.id}
                        className={`rounded-xl border ${
                          method.default ? "border-pink-600" : "border-gray-200"
                        }`}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {method.type} •••• {method.last4}
                              </p>
                              <p className="text-sm text-gray-600">
                                Expires {method.expiry}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" aria-label="Edit card">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Delete card"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {method.default ? "Default payment method" : "Backup payment method"}
                            </span>
                            <Switch checked={method.default} aria-readonly />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center text-sm text-gray-500">
                    No saved payment methods. Add a card during checkout to store it for future orders.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-6 p-6">
                <h2 className="mb-4 text-xl font-semibold">
                  Communication Preferences
                </h2>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">
                        Get updates about orders and offers
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.email}
                    onCheckedChange={(value) => updatePreferences({ email: value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">SMS Alerts</p>
                      <p className="text-sm text-gray-500">
                        Receive text notifications for deliveries
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.sms}
                    onCheckedChange={(value) => updatePreferences({ sms: value })}
                  />
                </div>

                <div className="pt-4">
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
