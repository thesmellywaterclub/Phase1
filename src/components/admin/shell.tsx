"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";

const navLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/catalog", label: "Catalog" },
] as const;

type AdminShellProps = {
  children: ReactNode;
};

function AccessMessage({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <Button asChild className="w-full">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const loginRedirectTarget =
    pathname && pathname.startsWith("/admin") ? pathname : "/admin";

  const activeHref = useMemo(() => {
    if (!pathname) {
      return null;
    }
    const match = navLinks.find((link) =>
      pathname === link.href || pathname.startsWith(`${link.href}/`)
    );
    return match?.href ?? null;
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(loginRedirectTarget)}`);
    }
  }, [user, router, loginRedirectTarget]);

  if (!user) {
    return null;
  }

  if (!user.isAdmin) {
    return (
      <AccessMessage
        title="Admin access required"
        description="Your account does not have permission to manage the catalog."
        actionLabel="Return to storefront"
        actionHref="/"
      />
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Smelly Water Club
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Admin workspace</h1>
            <p className="text-sm text-slate-500">
              Configure the catalog and manage marketplace tooling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
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
