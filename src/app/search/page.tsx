import type { Metadata } from "next";
import Link from "next/link";

import { AccountButton } from "@/components/account-button";
import { CartIndicator } from "@/components/cart-indicator";
import { SiteSearchBar } from "@/components/site-search-bar";
import { MobileNav } from "@/components/mobile-nav";
import { getHomePageData } from "@/data/home";
import { fetchProducts } from "@/data/products";
import {
  buildSearchSuggestions,
  coalesceSearchResults,
} from "@/lib/search";

import { SearchPageContent } from "./search-page-content";

export const metadata: Metadata = {
  title: "Search | The Smelly Water Club",
  description:
    "Find compositions, rituals, and journal entries from The Smelly Water Club.",
};

type SearchPageProps = {
  searchParams: {
    q?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const homeData = await getHomePageData();
  const journalEntries = homeData.journal;
  const initialQuery = searchParams?.q ?? "";
  const productList = await fetchProducts({
    limit: initialQuery ? 48 : 32,
    search: initialQuery || undefined,
  });
  const initialState = coalesceSearchResults(
    productList,
    journalEntries,
    initialQuery,
  );
  const suggestions = buildSearchSuggestions(productList);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="relative z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-5">
          <Link
            href="/"
            className="text-lg font-semibold uppercase tracking-[0.2em]"
            aria-label="The Smelly Water Club — home"
          >
            The Smelly Water Club
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-600 lg:flex">
            <Link href="/products" className="transition hover:text-gray-900">
              Collection
            </Link>
            <Link href="/search" className="font-medium text-gray-900">
              Search
            </Link>
            <Link href="/account" className="transition hover:text-gray-900">
              My Account
            </Link>
            <Link href="/cart" className="transition hover:text-gray-900">
              Cart
            </Link>
            <Link href="/login" className="transition hover:text-gray-900">
              Sign In
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <MobileNav />
            <SiteSearchBar
              placeholder="Search fragrances, rituals, stories…"
              className="hidden md:flex md:w-72 lg:w-80"
              initialValue={initialQuery}
            />
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
          </div>
        </div>
      </header>
      <div className="relative z-30 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <SiteSearchBar
          placeholder="Search fragrances, rituals, stories…"
          className="w-full"
          initialValue={initialQuery}
        />
      </div>

      <SearchPageContent
        initialQuery={initialQuery}
        initialState={{
          tokens: initialState.context.tokens,
          results: initialState.results,
        }}
        suggestions={suggestions}
      />
    </div>
  );
}
