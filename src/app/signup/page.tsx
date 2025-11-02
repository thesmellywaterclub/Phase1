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
  if (typeof payload === "object" && payload !== null && "error" in payload) {
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

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const nextParam = searchParams.get("next");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(nextParam || "/account");
    }
  }, [user, router, nextParam]);

  useEffect(() => {
    if (otpCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    setOtpError(null);
    setOtpStatus(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setOtpError("Enter your email address first.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setOtpError("Enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      await apiFetch("/api/auth/email-otp", {
        method: "POST",
        json: { email: trimmedEmail },
      });
      setOtp("");
      setOtpStatus("Verification code sent. Check your inbox.");
      setOtpCooldown(60);
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        const message = extractApiErrorMessage(apiError.body);
        setOtpError(message || "Unable to send verification code.");
      } else {
        setOtpError("Failed to send verification code. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOtpError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!otp.trim()) {
      setError("Enter the verification code sent to your email.");
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
      >("/api/auth/register", {
        method: "POST",
        json: {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          otpCode: otp.trim(),
        },
      });

      const { token, user: account } = response.data;
      const authUser: AuthUser = {
        id: account.id,
        name: account.fullName,
        email: account.email,
        avatarUrl: account.avatarUrl,
        phone: account.phone,
        isSeller: account.isSeller,
        clubMember: account.clubMember,
        clubVerified: account.clubVerified,
        sellerId: account.sellerId,
      };

      login({ token, user: authUser });

      const next = nextParam || "/account";
      router.replace(next);
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        const message = extractApiErrorMessage(apiError.body);
        setError(message || "Unable to create your account.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/">
                ← Back to home
              </Link>
            </Button>
            <Link
              href="/login"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Sign in
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create your Smelly Water Club account
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Unlock exclusive drops and manage your orders effortlessly.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  if (nextEmail !== email) {
                    setOtp("");
                    setOtpStatus(null);
                    setOtpError(null);
                  }
                  setEmail(nextEmail);
                }}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="otp">Email verification code</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || otpCooldown > 0}
                >
                  {isSendingOtp
                    ? "Sending…"
                    : otpCooldown > 0
                    ? `Resend in ${otpCooldown}s`
                    : "Send OTP"}
                </Button>
              </div>
              <Input
                id="otp"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter the 6-digit code"
              />
              {otpError && (
                <p className="text-xs text-rose-600">{otpError}</p>
              )}
              {otpStatus && !otpError && (
                <p className="text-xs text-emerald-600">{otpStatus}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555-123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            Need help?{" "}
            <Link href="/" className="text-pink-600 hover:text-pink-700">
              Return to homepage
            </Link>
            .
          </div>
          <div className="text-center text-sm text-gray-500">
            Want to sell on Smelly Water Club?{" "}
            <Link
              href="/seller/register"
              className="text-pink-600 hover:text-pink-700"
            >
              Register your store
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
