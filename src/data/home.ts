import { apiFetch, type ApiResponseEnvelope } from "@/lib/api-client"
import type { Product } from "./products"
import { getPrimaryMedia, products } from "./products"

export type HomeHero = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctas: Array<{
    label: string;
    href: string;
    emphasis?: boolean;
  }>;
  image: string;
};

export type HomeHighlight = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type HomeRitual = {
  id: string;
  title: string;
  focus: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  illustration: string;
};

export type HomeJournalEntry = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  image: string;
};

export type HomeMembershipPerk = {
  id: string;
  title: string;
  description: string;
};

export type HomeProductGalleryItem = {
  id: string;
  title: string;
  brandName: string;
  gender: Product["gender"];
  href: string;
  image: {
    url: string;
    alt: string | null;
  };
  lowestPricePaise: number | null;
  ratingAvg: number;
  ratingCount: number;
};

export type HomeGenderSection = {
  id: "men" | "women" | "unisex";
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  products: HomeProductGalleryItem[];
};

export type HomePageData = {
  hero: HomeHero;
  featuredProducts: Product[];
  productGallery: HomeProductGalleryItem[];
  genderSections: HomeGenderSection[];
  highlights: HomeHighlight[];
  rituals: HomeRitual[];
  journal: HomeJournalEntry[];
  membership: {
    headline: string;
    subheadline: string;
    perks: HomeMembershipPerk[];
  };
};

export type HomePageDataWithSource = HomePageData & {
  __source?: "api" | "fallback";
};

const homeStaticHeroFallback =
  "https://images.unsplash.com/photo-1573537805874-4cedc5d389ce?auto=format&fit=crop&w=1400&q=80";

function mapProductToGalleryItem(product: Product): HomeProductGalleryItem {
  const primaryMedia = getPrimaryMedia(product);
  return {
    id: product.id,
    title: product.title,
    brandName: product.brand.name,
    gender: product.gender,
    href: `/products/${product.slug}`,
    image: primaryMedia
      ? { url: primaryMedia.url, alt: primaryMedia.alt }
      : { url: homeStaticHeroFallback, alt: null },
    lowestPricePaise: product.aggregates.lowPricePaise,
    ratingAvg: product.aggregates.ratingAvg,
    ratingCount: product.aggregates.ratingCount,
  };
}

const fallbackFeaturedProducts = products.slice(0, 4);

const fallbackProductGallery = fallbackFeaturedProducts.map(mapProductToGalleryItem);

function buildFallbackSection(
  id: HomeGenderSection["id"],
  title: string,
  description: string,
  ctaHref: string,
  ctaLabel: string,
): HomeGenderSection {
  const filtered = fallbackProductGallery.filter((item) => item.gender === id);
  const productsForSection = filtered.length ? filtered : fallbackProductGallery;

  return {
    id,
    title,
    description,
    ctaHref,
    ctaLabel,
    products: productsForSection,
  };
}

const fallbackGenderSections: HomeGenderSection[] = [
  buildFallbackSection(
    "men",
    "For Him",
    "Cedar, spice, and mineral notes curated for evening silhouettes.",
    "/products?gender=men",
    "Shop men's perfumes",
  ),
  buildFallbackSection(
    "women",
    "For Her",
    "Bouquets of ambered florals and gourmand ribbons for after-dark rituals.",
    "/products?gender=women",
    "Shop women's perfumes",
  ),
  buildFallbackSection(
    "unisex",
    "For Everyone",
    "Silhouettes that sway between soft woods and luminous citrus accords.",
    "/products?gender=unisex",
    "Shop unisex perfumes",
  ),
];

const fallbackHomeData: HomePageData = {
  hero: null,
  featuredProducts: fallbackFeaturedProducts,
  productGallery: fallbackProductGallery,
  genderSections: fallbackGenderSections,
  highlights: [
    {
      id: "atelier",
      title: "Small-batch atelier craft",
      description:
        "All eau de parfums are poured in limited runs of 300 bottles, ensuring freshness and traceability.",
      icon: "Sparkles",
    },
    {
      id: "ingredients",
      title: "Responsible ingredient sourcing",
      description:
        "We partner with growers who certify organic extraction and reinvest in biodiversity initiatives.",
      icon: "Leaf",
    },
    {
      id: "service",
      title: "Personal ritual concierge",
      description:
        "Members receive complimentary pairing consults to build seasonal scent wardrobes.",
      icon: "MessagesSquare",
    },
  ],
  rituals: [
    {
      id: "velour-ritual",
      title: "Velour evening ritual",
      focus: "A rose-amber aura for after-hours salons.",
      steps: [
        {
          title: "Prep the pulse points",
          description:
            "Mist wrists and collarbone with rose water to prime the skin and extend diffusion.",
        },
        {
          title: "Anchor with No. II oil",
          description:
            "Press two drops of dry body oil into the décolletage to warm Velour's vanilla base.",
        },
        {
          title: "Finish with Atelier veil",
          description:
            "Walk through a micro cloud of Noir Atelier to add smoked saffron trails.",
        },
      ],
      illustration:
        "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "noir-ritual",
      title: "Midnight layering",
      focus: "Contrast oud depths with luminous citrus.",
      steps: [
        {
          title: "Begin with atelier musk",
          description:
            "Apply a single spray to the nape to anchor oud with skin-hugging warmth.",
        },
        {
          title: "Mist citrus high points",
          description:
            "A light spray of Bergamot Draft along the shoulders brightens Noir Atelier's smoke.",
        },
        {
          title: "Seal with saffron cold throw",
          description:
            "Finish on the outer garments to leave a saffron ember trail without overpowering.",
        },
      ],
      illustration:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  journal: [
    {
      id: "journal-micro-distillation",
      title: "Inside our micro-distillation studio",
      excerpt:
        "Tour the Marseille atelier where each velour accord is distilled and aged for at least 90 days.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "journal-layering",
      title: "Three layering stories for autumn soirées",
      excerpt:
        "Our scent director shares combinations that evolve from dusk cocktails to late-night galleries.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "journal-sourcing",
      title: "Sourcing petals with regenerative farmers",
      excerpt:
        "Meet the collectives powering our rose and jasmine harvests across Grasse and Jaipur.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  membership: {
    headline: "Join The Smelly Water Club",
    subheadline:
      "Preview limited releases, receive quarterly scent kits, and access live ritual salons.",
    perks: [
      {
        id: "monthly-drops",
        title: "Members-only monthly drops",
        description:
          "Reserve experimental accords and archival reissues before public release.",
      },
      {
        id: "complimentary-refills",
        title: "Complimentary mini refills",
        description:
          "Earn 10 ml travel refills with every second full-size purchase.",
      },
      {
        id: "concierge",
        title: "Concierge curation",
        description:
          "Chat with our ritual team for pairing suggestions tailored to your calendar.",
      },
    ],
  },
}

async function fetchHomeDataFromApi(): Promise<HomePageData | null> {
  try {
    const response = await apiFetch<ApiResponseEnvelope<HomePageData>>(
      "/api/home?featuredLimit=4",
    )
    return annotateHomeSource(response.data, "api")
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[home] Falling back to static data", error)
    }
    return null
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  const apiData = await fetchHomeDataFromApi()
  if (apiData) {
    return apiData
  }

  await new Promise((resolve) => setTimeout(resolve, 100))
  const clonedFallback = JSON.parse(
    JSON.stringify(fallbackHomeData),
  ) as HomePageData
  return annotateHomeSource(clonedFallback, "fallback")
}

function annotateHomeSource(
  payload: HomePageData,
  source: "api" | "fallback",
): HomePageData {
  Object.defineProperty(payload, "__source", {
    value: source,
    enumerable: false,
  })
  return payload
}
