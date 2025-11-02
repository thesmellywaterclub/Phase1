"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";

type SellerShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/offers", label: "Offers" },
  { href: "/seller/offers/new", label: "Add Offer" },
  { href: "/seller/locations", label: "Locations" },
] as const;

export function SellerShell({ children }: SellerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const activeHref = useMemo(() => {
    if (!pathname) {
      return null;
    }
    const match = navLinks.find((link) =>
      pathname === link.href || pathname.startsWith(`${link.href}/`)
    );
    return match?.href ?? null;
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Seller Console
            </h1>
            <p className="text-sm text-slate-500">
              Manage offers, inventory, and pickup locations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.name ?? "Seller"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email ?? "Signed in"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/">Storefront</Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
        <nav className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3">
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
