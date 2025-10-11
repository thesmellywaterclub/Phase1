import type { HomeJournalEntry } from "@/data/home";
import type { Product } from "@/data/products";

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
      if (!context.query) {
        return {
          id: product.id,
          title: product.title,
          description: product.subtitle,
          href: `/products/${product.slug}`,
          image: product.images[0],
          badges: product.badges,
          meta: `${product.rating.toFixed(1)} • ${product.ratingsCount} reviews`,
          type: "product" as const,
          score: 0,
        };
      }

      const fields = [
        product.title,
        product.subtitle,
        product.description,
        product.badges.join(" "),
        product.ingredients,
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
        product.badges.some((badge) =>
          badge.toLowerCase().includes(context.query),
        )
      ) {
        score += 0.25;
      }

      return {
        id: product.id,
        title: product.title,
        description: product.subtitle,
        href: `/products/${product.slug}`,
        image: product.images[0],
        badges: product.badges,
        meta: `${product.rating.toFixed(1)} • ${product.ratingsCount} reviews`,
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
    push(product.subtitle);
  }

  for (const product of products) {
    if (ensureLimit()) break;
    product.badges.forEach((badge) => {
      if (!ensureLimit()) push(badge);
    });
  }

  for (const product of products) {
    if (ensureLimit()) break;
    product.ingredients
      .split(",")
      .map((ingredient) => ingredient.trim())
      .forEach((ingredient) => {
        if (!ensureLimit()) push(ingredient);
      });
  }

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
