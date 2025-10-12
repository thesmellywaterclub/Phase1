"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, Sparkles, User2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

type MobileNavProps = {
  className?: string;
};

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const handleNavigate = (href: string) => {
    closeMenu();
    router.push(href);
  };

  const handleSignOut = () => {
    logout();
    closeMenu();
    router.push("/");
  };

  const menuItems = [
    { label: "Collection", href: "/products" },
    { label: "Search", href: "/search", icon: Search },
    { label: "My Cart", href: "/cart", icon: ShoppingBag },
  ];

  const accountItems = authUser
    ? [
        { label: "My Account", href: "/account", icon: User2 },
        { label: "Sign out", action: handleSignOut, isAccent: true },
      ]
    : [{ label: "Sign in", href: "/login", icon: User2 }];

  const portalContent: ReactNode =
    mounted
      ? createPortal(
      <>
        <div
          className={cn(
            "fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
            open ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0",
          )}
          aria-hidden="true"
          onClick={closeMenu}
        />
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-[160] flex w-80 max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden",
            open ? "translate-x-0" : "translate-x-full",
          )}
          aria-hidden={!open}
          aria-modal="true"
          role="dialog"
          aria-label="Mobile navigation menu"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-700">
              The Smelly Water Club
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="space-y-6">
              <div className="space-y-3 rounded-2xl border border-white/60 bg-rose-50/60 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-pink-700">
                  <Sparkles className="h-4 w-4" />
                  Atelier shortcuts
                </div>
                <p className="text-xs text-pink-700/80">
                  Find fragrances, rituals, and journal stories curated by the atelier.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full justify-center bg-pink-600 text-white hover:bg-pink-700"
                  onClick={() => handleNavigate("/search")}
                >
                  Search the atelier
                </Button>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-200 hover:bg-pink-50 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
                    >
                      <span>{item.label}</span>
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                  Account
                </p>
                <div className="space-y-2">
                  {accountItems.map((item) => {
                    if ("action" in item && item.action) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.action}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200",
                            item.isAccent
                              ? "bg-pink-50 text-pink-600 hover:bg-pink-100"
                              : "bg-white text-gray-700 hover:bg-gray-100",
                          )}
                        >
                          <span>{item.label}</span>
                        </button>
                      );
                    }
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          handleNavigate(item.href ?? "#");
                        }}
                        className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
                      >
                        <span>{item.label}</span>
                        {Icon ? <Icon className="h-4 w-4 text-gray-400" /> : null}
                      </button>
                    );
                  })}
                </div>
                {authUser ? (
                  <span className="block text-xs text-gray-500">
                    Signed in as{" "}
                    <span className="font-medium text-gray-700">{authUser.name}</span>
                  </span>
                ) : (
                  <span className="block text-xs text-gray-500">
                    Join the club to track orders and bookmarks.
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </>,
      document.body,
    )
      : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn("md:hidden", className)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {portalContent}
    </>
  );
}
