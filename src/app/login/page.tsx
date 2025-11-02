"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";
import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";

function extractApiErrorMessage(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload
  ) {
    const errorPayload = (payload as { error?: unknown }).error;
    if (
      typeof errorPayload === "object" &&
      errorPayload !== null &&
      "message" in errorPayload &&
      typeof (errorPayload as { message?: unknown }).message === "string"
    ) {
      const message = (errorPayload as { message: string }).message.trim();
      return message || null;
    }
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(nextParam || "/account");
    }
  }, [user, router, nextParam]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch<
        ApiResponseEnvelope<{
          token: string;
          user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
            phone: string | null;
            isSeller: boolean;
            clubMember: boolean;
            clubVerified: boolean;
            sellerId: string | null;
          };
        }>
      >("/api/auth/login", {
        method: "POST",
        json: { email, password },
      });

      const { token, user } = response.data;
      const authUser: AuthUser = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        isSeller: user.isSeller,
        clubMember: user.clubMember,
        clubVerified: user.clubVerified,
        sellerId: user.sellerId,
      };

      login({ token, user: authUser });

      const next = nextParam || "/account";
      router.replace(next);
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        const message = extractApiErrorMessage(apiError.body);
        setError(message || "Invalid email or password.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Sign in to The Smelly Water Club
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Access your orders, manage subscriptions, and more.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
              />
            </div>
            {error && (
              <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            By continuing, you agree to The Smelly Water Club&apos;s{" "}
            <Link href="#" className="text-pink-600 hover:text-pink-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-pink-600 hover:text-pink-700">
              Privacy Policy
            </Link>
            .
          </div>

          <div className="text-center text-sm">
            <Link
              href="/account"
              className="font-medium text-pink-600 hover:text-pink-700"
            >
              Back to customer profile
            </Link>
          </div>
          <div className="text-center text-sm text-gray-500">
            New to the club?{" "}
            <Link
              href="/signup"
              className="text-pink-600 hover:text-pink-700"
            >
              Create an account
            </Link>
            .
          </div>
          <div className="text-center text-sm text-gray-500">
            Run a fragrance store?{" "}
            <Link
              href="/seller/register"
              className="text-pink-600 hover:text-pink-700"
            >
              Register as a seller
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
