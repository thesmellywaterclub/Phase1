"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth-store";

type AccountButtonProps = {
  className?: string;
};

export function AccountButton({ className }: AccountButtonProps) {
  const authUser = useAuthStore((state) => state.user);

  if (!authUser) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900",
          className
        )}
      >
        Sign in
      </Link>
    );
  }

  const displayName = authUser.name || "Member";
  const initials = displayName.charAt(0).toUpperCase();

  const targetHref = authUser.isAdmin
    ? "/admin"
    : authUser.sellerId
      ? "/seller"
      : "/account";

  return (
    <Link
      href={targetHref}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900",
        className
      )}
    >
      <Avatar className="h-8 w-8">
        {authUser.avatarUrl ? (
          <AvatarImage src={authUser.avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="hidden sm:inline">{displayName}</span>
    </Link>
  );
}
