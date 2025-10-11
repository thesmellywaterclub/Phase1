"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useState,
} from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  onSuggestionSelect?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  isLoading?: boolean;
  className?: string;
  ariaLabel?: string;
  suggestions?: string[];
  maxSuggestions?: number;
};

export function SearchBar({
  value,
  onValueChange,
  onSubmit,
  onClear,
  onSuggestionSelect,
  placeholder = "Search fragrances, rituals, stories…",
  autoFocus,
  isLoading = false,
  className,
  ariaLabel,
  suggestions = [],
  maxSuggestions = 6,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions.length) {
      return [];
    }
    const normalized = value.trim().toLowerCase();
    const matches = suggestions
      .filter((suggestion) => {
        if (!suggestion) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return suggestion.toLowerCase().includes(normalized);
      })
      .slice(0, maxSuggestions);
    return matches;
  }, [maxSuggestions, suggestions, value]);

  const showSuggestions = isOpen && filteredSuggestions.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setIsOpen(false);
  };

  const handleClear = () => {
    onValueChange("");
    onClear?.();
    setIsOpen(false);
  };

  const handleSuggestionPick = (suggestion: string) => {
    onValueChange(suggestion);
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && filteredSuggestions.length > 0) {
      event.preventDefault();
      const first = filteredSuggestions[0];
      handleSuggestionPick(first);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "group relative flex h-12 items-center rounded-full border border-gray-200 bg-white/85 px-4 text-sm shadow-sm backdrop-blur transition focus-within:border-gray-900 focus-within:shadow-lg",
        className,
      )}
    >
      <Search
        className="mr-3 h-4 w-4 shrink-0 text-gray-400 transition group-focus-within:text-gray-700"
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 100);
        }}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:outline-none"
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 animate-spin text-gray-400"
          />
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-gray-400 transition hover:border-gray-200 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button type="submit" className="sr-only">
        Search
      </button>
      {showSuggestions ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-2xl border border-gray-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
          <ul className="flex flex-col gap-1 text-gray-700">
            {filteredSuggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionPick(suggestion);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-pink-50 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
