import type { HomeJournalEntry } from "@/data/home";
import type { Product } from "@/data/products";
import { getPrimaryMedia } from "@/data/products";
import { formatPaise } from "@/lib/money";

export type SearchResultType = "product" | "journal";

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  image?: string;
  badges?: string[];
  meta?: string;
  type: SearchResultType;
  score: number;
};

export type ProductSearchContext = {
  query: string;
  tokens: string[];
};

export type SearchResultsSet = {
  products: SearchResult[];
  journal: SearchResult[];
};

export type SearchResultsPayload = {
  context: ProductSearchContext;
  results: SearchResultsSet;
};

function formatGenderLabel(gender: Product["gender"]): string {
  switch (gender) {
    case "men":
      return "For Men";
    case "women":
      return "For Women";
    case "unisex":
      return "Unisex";
    default:
      return "For All";
  }
}

export function buildSearchContext(query: string): ProductSearchContext {
  const normalized = query.trim().toLowerCase();
  return {
    query: normalized,
    tokens: normalized
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  };
}

export function searchProducts(
  products: Product[],
  context: ProductSearchContext,
) {
  const results = products
    .map<SearchResult | null>((product) => {
      const primaryMedia = getPrimaryMedia(product);
      const genderLabel = formatGenderLabel(product.gender);
      const aromaticHighlight = product.notes.top.slice(0, 3).join(" • ");
      const description = [product.brand.name, genderLabel, aromaticHighlight]
        .filter(Boolean)
        .join(" · ");
      const badges = Array.from(
        new Set(
          [
            product.brand.name,
            genderLabel,
            ...product.notes.top.slice(0, 2),
            ...product.notes.heart.slice(0, 1),
          ].filter(Boolean),
        ),
      );
      const priceLabel = formatPaise(product.aggregates.lowPricePaise, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      const ratingLabel = `${product.aggregates.ratingAvg.toFixed(1)} ★ • ${product.aggregates.ratingCount} reviews`;
      const meta = product.aggregates.lowPricePaise
        ? `${priceLabel} • ${product.aggregates.ratingAvg.toFixed(1)} ★ • ${product.aggregates.ratingCount} reviews`
        : ratingLabel;

      if (!context.query) {
        return {
          id: product.id,
          title: product.title,
          description,
          href: `/products/${product.slug}`,
          image: primaryMedia?.url,
          badges,
          meta,
          type: "product" as const,
          score: 0,
        };
      }

      const fields = [
        product.title,
        product.brand.name,
        genderLabel,
        product.description,
        product.notes.top.join(" "),
        product.notes.heart.join(" "),
        product.notes.base.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const token of context.tokens) {
        if (!fields.includes(token)) {
          return null;
        }
        const tokenMatchesTitle = product.title.toLowerCase().includes(token);
        const tokenStartsTitle = product.title
          .toLowerCase()
          .startsWith(token);
        score += 1;
        if (tokenMatchesTitle) {
          score += 0.5;
        }
        if (tokenStartsTitle) {
          score += 0.5;
        }
      }

      if (
        badges.some((badge) => badge.toLowerCase().includes(context.query))
      ) {
        score += 0.25;
      }

      return {
        id: product.id,
        title: product.title,
        description,
        href: `/products/${product.slug}`,
        image: primaryMedia?.url,
        badges,
        meta,
        type: "product" as const,
        score,
      };
    })
    .filter((result): result is SearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return results;
}

export function searchJournalEntries(
  journal: HomeJournalEntry[],
  context: ProductSearchContext,
) {
  const results = journal
    .map<SearchResult | null>((entry) => {
      if (!context.query) {
        return {
          id: entry.id,
          title: entry.title,
          description: entry.excerpt,
          href: entry.href,
          image: entry.image,
          type: "journal" as const,
          score: 0,
        };
      }

      const fields = [entry.title, entry.excerpt].join(" ").toLowerCase();
      let score = 0;
      for (const token of context.tokens) {
        if (!fields.includes(token)) {
          return null;
        }
        const tokenMatchesTitle = entry.title.toLowerCase().includes(token);
        score += 1;
        if (tokenMatchesTitle) {
          score += 0.25;
        }
      }

      return {
        id: entry.id,
        title: entry.title,
        description: entry.excerpt,
        href: entry.href,
        image: entry.image,
        type: "journal" as const,
        score,
      };
    })
    .filter((result): result is SearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return results;
}

export function coalesceSearchResults(
  products: Product[],
  journal: HomeJournalEntry[],
  query: string,
): SearchResultsPayload {
  const context = buildSearchContext(query);
  const productResults = searchProducts(products, context);
  const journalResults = searchJournalEntries(journal, context);
  return {
    context,
    results: {
      products: productResults,
      journal: journalResults,
    },
  };
}

export function buildSearchSuggestions(
  products: Product[],
  limit = 16,
): string[] {
  const suggestions: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(trimmed);
  };

  const ensureLimit = () => suggestions.length >= limit;

  for (const product of products) {
    if (ensureLimit()) break;
    push(product.title);
  }

  for (const product of products) {
    if (ensureLimit()) break;
    push(product.brand.name);
  }

  for (const product of products) {
    if (ensureLimit()) break;
    push(formatGenderLabel(product.gender));
  }

  // Use accords as searchable suggestions

  for (const product of products) {
    if (ensureLimit()) break;
    product.notes.top.forEach((note) => {
      if (!ensureLimit()) push(note);
    });
    product.notes.heart.forEach((note) => {
      if (!ensureLimit()) push(note);
    });
    product.notes.base.forEach((note) => {
      if (!ensureLimit()) push(note);
    });
  }

  const curated = [
    "Layering ritual",
    "Evening composition",
    "Giftable trio",
    "Amber vanilla",
  ];
  curated.forEach((item) => {
    if (!ensureLimit()) push(item);
  });

  return suggestions.slice(0, limit);
}
