export type ProductBadge = string

export type ProductVariant = {
  id: string
  label: string
  price: number
  compareAt: number | null
  stock: number
}

export type ProductNotes = {
  top: string[]
  heart: string[]
  base: string[]
}

export type RelatedProduct = {
  id: string
  name: string
  price: number
  image: string
}

export type Product = {
  id: string
  slug: string
  title: string
  subtitle: string
  sku: string
  rating: number
  ratingsCount: number
  badges: ProductBadge[]
  images: string[]
  heroImage?: string
  variants: ProductVariant[]
  notes: ProductNotes
  description: string
  returns: string
  ingredients: string
  related: RelatedProduct[]
}

export const products: Product[] = [
  {
    id: "velour-edp",
    slug: "velour-eau-de-parfum",
    title: "Velour Eau de Parfum",
    subtitle: "Rose • Amber • Vanilla",
    sku: "VEL-EDP-50ML",
    rating: 4.7,
    ratingsCount: 312,
    badges: ["Bestseller", "Long-lasting"],
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1526312948761-7e5506a3111a?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1523294587484-bae6cc870010?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1524592094895-175005dcfb58?auto=format&fit=crop&w=1350&q=80",
    ],
    variants: [
      { id: "50ml", label: "50 ml", price: 119, compareAt: 149, stock: 23 },
      { id: "100ml", label: "100 ml", price: 169, compareAt: 189, stock: 9 },
      { id: "mini", label: "Travel 10 ml", price: 29, compareAt: null, stock: 0 },
    ],
    notes: {
      top: ["Bergamot", "Pink Pepper"],
      heart: ["Damask Rose", "Jasmine"],
      base: ["Amber", "Vanilla", "Musk"],
    },
    description:
      "Velour wraps skin in an airy rose-amber veil, diffusing into a plush vanilla-musk finish. Crafted in Grasse with a high oil concentration for long wear.",
    returns:
      "Free 14-day returns. 1-year limited warranty against manufacturing defects.",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Linalool, Citronellol, Geraniol, Coumarin.",
    related: [
      {
        id: "layer-1",
        name: "Velour Layer I",
        price: 92,
        image:
          "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "layer-2",
        name: "Velour Layer II",
        price: 93,
        image:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "layer-3",
        name: "Velour Layer III",
        price: 94,
        image:
          "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "layer-4",
        name: "Velour Layer IV",
        price: 95,
        image:
          "https://images.unsplash.com/photo-1530639836607-6079c56581b0?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "noir-atelier",
    slug: "noir-atelier-parfum",
    title: "Noir Atelier Parfum",
    subtitle: "Oud • Saffron • Smoke",
    sku: "NOIR-AT-75ML",
    rating: 4.5,
    ratingsCount: 189,
    badges: ["Limited edition", "Evening"],
    images: [
      "https://images.unsplash.com/photo-1503551723145-6c040742065b?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1498843053639-170ff2122f35?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1524592094895-175005dcfb58?auto=format&fit=crop&w=1080&q=80",
    ],
    variants: [
      { id: "75ml", label: "75 ml", price: 210, compareAt: 240, stock: 12 },
      { id: "120ml", label: "120 ml", price: 260, compareAt: null, stock: 4 },
    ],
    notes: {
      top: ["Saffron", "Black Pepper"],
      heart: ["Cedarwood", "Rose Absolute"],
      base: ["Oud", "Smoked Amber"],
    },
    description:
      "Noir Atelier layers saffron and smoked oud for a bold night signature, softened with a rose heart and cedar resonance.",
    returns:
      "Complimentary returns within 30 days. Includes velvet travel pouch.",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Evernia Prunastri, Coumarin, Cinnamal, Benzyl Benzoate.",
    related: [
      {
        id: "velour-edp",
        name: "Velour Eau de Parfum",
        price: 119,
        image:
          "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "atelier-1",
        name: "Atelier Candela",
        price: 58,
        image:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
]

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function getProductVariant(productSlug: string, variantId: string) {
  const product = getProductBySlug(productSlug)
  return product?.variants.find((variant) => variant.id === variantId)
}

export function getDefaultVariant(productSlug: string) {
  const product = getProductBySlug(productSlug)
  return product?.variants[0] ?? null
}
