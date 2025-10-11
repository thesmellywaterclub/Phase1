"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SearchBar } from "./search-bar";

type SiteSearchBarProps = {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function SiteSearchBar({
  placeholder = "Search the atelier…",
  className,
  autoFocus,
}: SiteSearchBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadSuggestions() {
      try {
        const response = await fetch("/api/search/suggestions", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }
        const data: { suggestions: string[] } = await response.json();
        if (isMounted) {
          setSuggestions(data.suggestions ?? []);
        }
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === "AbortError";
        if (!isAbort) {
          console.error("Failed loading search suggestions", error);
        }
      }
    }

    loadSuggestions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    setValue(trimmed);
    const href = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    router.push(href);
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <SearchBar
      value={value}
      onValueChange={setValue}
      onSubmit={submitSearch}
      onSuggestionSelect={submitSearch}
      onClear={handleClear}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      suggestions={suggestions}
    />
  );
}
