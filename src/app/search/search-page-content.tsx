"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ArrowUpRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SearchResult,
  SearchResultsSet,
} from "@/lib/search";

type SearchHydrationState = {
  tokens: string[];
  results: SearchResultsSet;
};

type SearchApiResponse = {
  query: string;
  tokens: string[];
  results: SearchResultsSet;
};

type SearchPageContentProps = {
  initialQuery: string;
  initialState: SearchHydrationState;
  suggestions: string[];
};

type ResultSectionProps = {
  title: string;
  caption: string;
  results: SearchResult[];
  tokens: string[];
};

const SECTION_LABEL: Record<SearchResult["type"], string> = {
  product: "Composition",
  journal: "Journal entry",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightCopy(text: string, tokens: string[]): ReactNode {
  if (!tokens.length) {
    return text;
  }

  const uniqueTokens = Array.from(new Set(tokens.map((token) => token.toLowerCase())));
  const pattern = new RegExp(
    `(${uniqueTokens.map(escapeRegExp).join("|")})`,
    "gi",
  );

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    const lower = part.toLowerCase();
    const isHighlight = uniqueTokens.includes(lower);

    if (isHighlight) {
      return (
        <mark
          key={`match-${index}-${part}`}
          className="rounded-sm bg-pink-100 px-0.5 text-gray-900"
        >
          {part}
        </mark>
      );
    }

    return <Fragment key={`copy-${index}-${part}`}>{part}</Fragment>;
  });
}

function ResultCard({
  result,
  tokens,
}: {
  result: SearchResult;
  tokens: string[];
}) {
  return (
    <Link
      href={result.href}
      className="group flex gap-4 rounded-3xl border border-gray-200 bg-white/90 p-4 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
        {result.image ? (
          <Image
            src={result.image}
            alt={result.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
            {SECTION_LABEL[result.type]}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-pink-500">
          <span>{SECTION_LABEL[result.type]}</span>
          <span aria-hidden="true" className="text-gray-300">
            •
          </span>
          <span className="text-gray-400">{result.type === "product" ? "In stock" : "Feature"}</span>
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          {highlightCopy(result.title, tokens)}
        </h3>
        <p className="line-clamp-3 text-sm text-gray-600">
          {highlightCopy(result.description, tokens)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {result.meta ? (
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              {result.meta}
            </span>
          ) : null}
          {result.badges?.slice(0, 3).map((badge) => (
            <Badge
              key={`${result.id}-${badge}`}
              className="border-none bg-pink-100 text-pink-700"
            >
              {badge}
            </Badge>
          ))}
        </div>
      </div>
      <ArrowUpRight
        className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-pink-500"
        aria-hidden="true"
      />
    </Link>
  );
}

function ResultSection({ title, caption, results, tokens }: ResultSectionProps) {
  if (!results.length) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            {title}
          </h2>
          <p className="text-sm text-gray-600">{caption}</p>
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
          {results.length} {results.length === 1 ? "result" : "results"}
        </span>
      </div>
      <div className="grid gap-3 md:gap-4">
        {results.map((result) => (
          <ResultCard
            key={`${result.type}-${result.id}`}
            result={result}
            tokens={tokens}
          />
        ))}
      </div>
    </section>
  );
}

export function SearchPageContent({
  initialQuery,
  initialState,
  suggestions,
}: SearchPageContentProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [resultsState, setResultsState] = useState<SearchResultsSet>(
    initialState.results,
  );
  const [tokens, setTokens] = useState<string[]>(initialState.tokens);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const isInitialRender = useRef(true);

  useEffect(() => {
    setInputValue(initialQuery);
    setResultsState(initialState.results);
    setTokens(initialState.tokens);
    isInitialRender.current = true;
  }, [initialQuery, initialState.results, initialState.tokens]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const next = inputValue.trim();
    const params = new URLSearchParams();
    if (next) {
      params.set("q", next);
    }
    const paramsString = params.toString();
    const href = paramsString ? `${pathname}?${paramsString}` : pathname;
    router.replace(href, { scroll: false });

    const controller = new AbortController();
    const requestUrl = paramsString
      ? `/api/search?${paramsString}`
      : "/api/search";

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(requestUrl, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Search request failed");
        }
        const data: SearchApiResponse = await response.json();
        startTransition(() => {
          setTokens(data.tokens);
          setResultsState(data.results);
        });
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === "AbortError";
        if (!isAbort) {
          console.error("Failed to fetch search results", error);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [inputValue, pathname, router, startTransition]);

  const handleSuggestion = (value: string) => {
    setInputValue(value);
  };

  const productResults = resultsState.products;
  const journalResults = resultsState.journal;
  const totalResults = productResults.length + journalResults.length;
  const hasQuery = inputValue.trim().length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10">
      <div className="space-y-12">
        <section className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white/80 px-6 py-8 shadow-sm backdrop-blur sm:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Trending searches
            </span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        {totalResults > 0 ? (
          <div className="space-y-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                  {hasQuery ? (
                    <>
                      Results for{" "}
                      <span className="text-pink-600">“{inputValue}”</span>
                    </>
                  ) : (
                    "Curated highlights"
                  )}
                </h2>
                <p className="text-sm text-gray-600">
                  {hasQuery
                    ? "Browse compositions and stories that match your search."
                    : "Start typing or pick a trending query to explore our rituals and journal entries."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-400">
                <span>Total matches</span>
                <span className="rounded-full border border-gray-200 px-2 py-1 text-gray-600">
                  {totalResults}
                </span>
              </div>
            </div>

            <div className="space-y-12">
              <ResultSection
                title="Compositions"
                caption="Eau de parfums, layering oils, and limited releases."
                results={productResults}
                tokens={tokens}
              />
              <ResultSection
                title="Journal & Rituals"
                caption="Guides, conversations, and atelier dispatches."
                results={journalResults}
                tokens={tokens}
              />
            </div>
          </div>
        ) : (
          <section className="rounded-[2.5rem] border border-dashed border-gray-300 bg-white/70 px-6 py-16 text-center shadow-inner sm:px-10">
            <div className="mx-auto max-w-xl space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {hasQuery ? (
                  <>
                    We couldn&apos;t find matches for{" "}
                    <span className="text-pink-600">“{inputValue}”</span>
                  </>
                ) : (
                  "Start exploring the atelier"
                )}
              </h2>
              <p className="text-sm text-gray-600">
                {hasQuery
                  ? "Refine your search with fragrance notes, badges, or try the suggestions below."
                  : "Begin by entering a note, product name, or story topic."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={`empty-${suggestion}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestion(suggestion)}
                    className="rounded-full border-gray-200 px-4 text-xs font-medium text-gray-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
