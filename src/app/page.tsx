"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  Repeat2,
  Store,
  Gift,
  Info,
  Heart,
  Share2,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

const product = {
  id: "velour-edp",
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
};

export default function ProductDetailPage() {
  const [variant, setVariant] = useState(product.variants[0]);
  const [qty, setQty] = useState(1);
  const inStock = variant.stock > 0;

  const [subscribe, setSubscribe] = useState(false);
  const subDiscount = 0.15;
  const price = subscribe
    ? Math.round(variant.price * (1 - subDiscount))
    : variant.price;

  const [active, setActive] = useState(0);
  const next = () => setActive((i) => (i + 1) % product.images.length);
  const prev = () =>
    setActive((i) => (i - 1 + product.images.length) % product.images.length);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState({ show: false, x: 50, y: 50 });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <a href="#" className="font-extrabold tracking-wide">
            Veloura
          </a>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <nav className="truncate text-sm text-gray-500">
            <a className="hover:text-gray-900" href="#">
              Home
            </a>
            <span className="px-1">/</span>
            <a className="hover:text-gray-900" href="#">
              Women
            </a>
            <span className="px-1">/</span>
            <span className="text-gray-800">Velour</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {product.title}
            </h1>
            <p className="text-gray-600">{product.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center text-sm text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 font-medium">{product.rating}</span>
                <span className="ml-1 text-gray-500">
                  ({product.ratingsCount})
                </span>
              </div>
              {product.badges.map((badge) => (
                <Badge
                  key={badge}
                  className="border-none bg-pink-100 text-pink-700"
                >
                  {badge}
                </Badge>
              ))}
              <span className="text-xs text-gray-400">SKU: {product.sku}</span>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-sm text-gray-600 md:flex">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Check store availability
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gift wrap available
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 lg:hidden">
            <img
              src={product.images[active]}
              alt="Product view"
              className="h-full w-full object-cover"
            />
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {product.images.map((src, index) => (
              <button
                key={src}
                onClick={() => setActive(index)}
                className={`min-w-20 overflow-hidden rounded-xl border ${
                  index === active
                    ? "border-pink-500"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="h-20 w-20 object-cover"
                />
              </button>
            ))}
          </div>

          <div className="hidden grid-cols-2 gap-4 lg:grid">
            {product.images.slice(0, 4).map((src, index) => (
              <div
                key={src}
                ref={index === 0 ? wrapRef : undefined}
                onMouseEnter={() =>
                  setZoom((z) => ({ ...z, show: index === 0 }))
                }
                onMouseLeave={() => setZoom((z) => ({ ...z, show: false }))}
                onMouseMove={(event) => {
                  if (!wrapRef.current || index !== 0) return;
                  const rect = wrapRef.current.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / rect.width) * 100;
                  const y = ((event.clientY - rect.top) / rect.height) * 100;
                  setZoom({ show: true, x, y });
                }}
                className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
              >
                <img
                  src={src}
                  alt="Gallery view"
                  className="h-full w-full object-cover"
                />
                {index === 0 && zoom.show && (
                  <div
                    className="absolute hidden h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/70 pointer-events-none xl:block"
                    style={{
                      left: `${zoom.x}%`,
                      top: `${zoom.y}%`,
                      backgroundImage: `url(${src})`,
                      backgroundSize: `220% 220%`,
                      backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                    }}
                  />
                )}
              </div>
            ))}
            <div className="col-span-2 overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={product.images[4]}
                alt="Detail view"
                className="h-[520px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <Card className="sticky top-20 gap-0 rounded-2xl border border-gray-200 p-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold">${price}</span>
                    {variant.compareAt && (
                      <span className="text-gray-400 line-through">
                        ${variant.compareAt}
                      </span>
                    )}
                  </div>
                  {subscribe && (
                    <div className="mt-1 text-xs text-green-700">
                      Subscription applied -{Math.round(subDiscount * 100)}%
                    </div>
                  )}
                </div>
                <Badge
                  className={`border-none ${
                    inStock
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {inStock ? `In stock (${variant.stock})` : "Out of stock"}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="flex items-center gap-1 font-medium">
                    <Repeat2 className="h-4 w-4" />
                    Subscribe & save 15%
                  </div>
                  <p className="text-gray-600">Deliver every 30 / 60 / 90 days</p>
                </div>
                <Button
                  variant={subscribe ? "default" : "outline"}
                  onClick={() => setSubscribe((prev) => !prev)}
                >
                  {subscribe ? "On" : "Add"}
                </Button>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium">Size</div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((option) => (
                    <button
                      key={option.id}
                      disabled={option.stock === 0}
                      onClick={() => setVariant(option)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        variant.id === option.id
                          ? "border-pink-600 bg-pink-50 text-pink-700"
                          : "border-gray-300 hover:border-gray-400"
                      } ${option.stock === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 text-sm text-gray-700">
                <Truck className="h-5 w-5" />
                <div>
                  <div>Free express shipping over $99</div>
                  <div className="text-gray-500">
                    Estimated delivery: 2–4 business days
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-full border px-3 py-2">
                  <button
                    onClick={() => setQty((current) => Math.max(1, current - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty((current) => current + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  disabled={!inStock}
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                >
                  Add to cart
                </Button>
              </div>
              <Button
                disabled={!inStock}
                variant="outline"
                className="mt-3 w-full"
              >
                Buy now
              </Button>

              <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Authentic
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Gift-ready
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Secure checkout
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="desc">
                <AccordionTrigger>About this fragrance</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="notes">
                <AccordionTrigger>Fragrance notes</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="gap-0 rounded-xl border border-gray-200 p-0">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-500">TOP</div>
                        <div className="mt-1 space-y-1 font-medium">
                          {product.notes.top.map((note) => (
                            <div key={note}>{note}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="gap-0 rounded-xl border border-gray-200 p-0">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-500">HEART</div>
                        <div className="mt-1 space-y-1 font-medium">
                          {product.notes.heart.map((note) => (
                            <div key={note}>{note}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="gap-0 rounded-xl border border-gray-200 p-0">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-500">BASE</div>
                        <div className="mt-1 space-y-1 font-medium">
                          {product.notes.base.map((note) => (
                            <div key={note}>{note}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ingredients">
                <AccordionTrigger>Ingredients</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">{product.ingredients}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger>Returns &amp; Warranty</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">{product.returns}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="lg:col-span-5">
            <Card className="gap-0 rounded-2xl border border-gray-200 p-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold">{product.rating}</div>
                  <div>
                    <div className="text-amber-500">★★★★★</div>
                    <div className="text-sm text-gray-500">
                      Based on {product.ratingsCount} reviews
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((score) => (
                    <div key={score} className="flex items-center gap-2">
                      <span className="w-6 text-sm">{score}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${(6 - score) * 12 + 28}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  Read all reviews
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4 gap-0 rounded-2xl border border-gray-200 p-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                  <div>
                    <div className="font-medium">
                      Questions about fit or notes?
                    </div>
                    <p className="text-sm text-gray-600">
                      Ask the community or our perfumer support team.
                    </p>
                  </div>
                </div>
                <Button className="mt-3 w-full bg-pink-600 hover:bg-pink-700">
                  Ask a question
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-semibold">Pairs well with</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {product.related.map((item) => (
              <Card
                key={item.id}
                className="gap-0 rounded-2xl border border-gray-200 p-0 transition hover:shadow-md"
              >
                <CardContent className="p-3">
                  <div className="aspect-square overflow-hidden rounded-xl bg-white">
                    <img
                      loading="lazy"
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="font-medium">{item.name}</div>
                    <div className="font-bold text-pink-600">${item.price}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
