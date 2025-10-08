"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { cartCountSelector, useCartStore } from "@/lib/cart-store";

type CartIndicatorProps = {
  className?: string;
};

export function CartIndicator({ className }: CartIndicatorProps) {
  const count = useCartStore(cartCountSelector);

  return (
    <Link
      href="/cart"
      aria-label="View cart"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-gray-400 hover:text-gray-900",
        className
      )}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-pink-600 px-1 text-[0.65rem] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
