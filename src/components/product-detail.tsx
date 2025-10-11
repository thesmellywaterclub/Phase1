"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

import type { Product, RelatedProduct } from "@/data/products";
import { CartIndicator } from "@/components/cart-indicator";
import { useCartStore } from "@/lib/cart-store";
import { AccountButton } from "@/components/account-button";
import { cn } from "@/lib/utils";

type ProductDetailProps = {
  product: Product;
};

export function ProductDetail({ product }: ProductDetailProps) {
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
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const maxQty = variant.stock ?? Number.POSITIVE_INFINITY;
  const limitReached = Number.isFinite(maxQty) && qty >= maxQty;
  const showLimitWarning = inStock && limitReached;
  const outOfStock = !inStock;
  const [accordionValue, setAccordionValue] = useState<string | null>(null);
  const noteSections = [
    {
      id: "top",
      label: "Top Accord",
      caption: "First impression",
      notes: product.notes.top,
      accent: "from-rose-100/70 via-rose-50/60 to-white",
    },
    {
      id: "heart",
      label: "Heart Accord",
      caption: "Signature trail",
      notes: product.notes.heart,
      accent: "from-pink-100/70 via-pink-50/60 to-white",
    },
    {
      id: "base",
      label: "Base Accord",
      caption: "Lingering finish",
      notes: product.notes.base,
      accent: "from-amber-100/70 via-amber-50/60 to-white",
    },
  ];
  const layeringSuggestions = [
    {
      title: "Prime the pulse points",
      description: `Warm wrists and collarbone so ${product.notes.top
        .slice(0, 2)
        .join(" & ")} diffuse with brightness.`,
    },
    product.related[0]
      ? ({
          title: `Veil with ${product.related[0].name}`,
          description: `Mist a light cloud of ${product.related[0].name} to echo the ${product.notes.heart[0]?.toLowerCase() ?? "heart"} accord.`,
          related: product.related[0],
        } satisfies { title: string; description: string; related: RelatedProduct })
      : null,
    {
      title: "Finish with a floating mist",
      description: `Spray ${product.title} from arm's length to leave a soft trail of ${product.notes.base
        .slice(0, 2)
        .join(" & ")}.`,
    },
  ].filter((item): item is { title: string; description: string; related?: RelatedProduct } => item !== null);

  useEffect(() => {
    setQty((current) => {
      if (!variant.stock) {
        return 0;
      }
      return Math.max(1, Math.min(current, variant.stock));
    });
  }, [variant]);

  useEffect(() => {
    if (!variantParam) return;
    const matched = product.variants.find((option) => option.id === variantParam);
    if (!matched) return;
    setVariant((current) => (current.id === matched.id ? current : matched));
  }, [variantParam, product.variants]);

  const focusNotesSection = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash === "notes") {
      setAccordionValue("notes");
      window.requestAnimationFrame(() => {
        document
          .getElementById("notes")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  useEffect(() => {
    focusNotesSection();
    window.addEventListener("hashchange", focusNotesSection);
    return () => window.removeEventListener("hashchange", focusNotesSection);
  }, [focusNotesSection]);

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product.slug, variant.id, qty);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addItem(product.slug, variant.id, qty);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <a href="#" className="font-extrabold tracking-wide">
            The Smelly Water Club
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
            <span className="text-gray-800">{product.title}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
            </Button>
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
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
                <img src={src} alt="" className="h-20 w-20 object-cover" />
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
                    className="pointer-events-none absolute hidden h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/70 xl:block"
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
                src={product.images[4] ?? product.images[0]}
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
                  {product.variants.map((option) => {
                    const optionInStock = option.stock > 0;
                    const isActive = variant.id === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setVariant(option)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition",
                          optionInStock
                            ? "border-gray-300 hover:border-gray-400"
                            : "border-rose-200 bg-rose-50 text-rose-500 hover:border-rose-300",
                          isActive &&
                            (optionInStock
                              ? "border-pink-600 bg-pink-50 text-pink-700"
                              : "border-rose-600 bg-rose-600 text-white"),
                          !optionInStock && "cursor-pointer"
                        )}
                        aria-pressed={isActive}
                      >
                        <span>{option.label}</span>
                        {!optionInStock && (
                          <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-rose-600">
                            Sold out
                          </span>
                        )}
                      </button>
                    );
                  })}
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
                <div
                  className={cn(
                    "inline-flex items-center gap-3 rounded-full border px-3 py-2 transition",
                    outOfStock && "border-rose-200 bg-rose-50 text-rose-400"
                  )}
                >
                  <button
                    onClick={() =>
                      setQty((current) => Math.max(1, current - 1))
                    }
                    aria-label="Decrease quantity"
                    disabled={outOfStock}
                    className={cn(
                      "transition",
                      outOfStock && "text-rose-300"
                    )}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{qty}</span>
                  <button
                    onClick={() =>
                      setQty((current) =>
                        inStock
                          ? Math.min(current + 1, maxQty)
                          : current
                      )
                    }
                    aria-label="Increase quantity"
                    disabled={outOfStock || limitReached}
                    className={cn(
                      "disabled:opacity-40",
                      outOfStock && "text-rose-300 disabled:opacity-100"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {showLimitWarning && (
                  <div className="text-xs text-amber-600">
                    Max available reached
                  </div>
                )}
                <Button
                  disabled={outOfStock}
                  className={cn(
                    "flex-1",
                    outOfStock
                      ? "bg-rose-600 text-white hover:bg-rose-600 disabled:opacity-100"
                      : "bg-pink-600 hover:bg-pink-700"
                  )}
                  onClick={handleAddToCart}
                >
                  {outOfStock ? "Out of stock" : "Add to cart"}
                </Button>
              </div>
              {outOfStock && (
                <div className="mt-2 text-xs font-medium text-rose-600">
                  This variation is currently unavailable.
                </div>
              )}
              <Button
                disabled={outOfStock}
                variant="outline"
                className={cn(
                  "mt-3 w-full",
                  outOfStock && "border-rose-200 text-rose-400"
                )}
                onClick={handleBuyNow}
              >
                {outOfStock ? "Unavailable" : "Buy now"}
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
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={(value) => setAccordionValue(value || null)}
              className="space-y-4"
            >
              <AccordionItem value="desc">
                <AccordionTrigger>About this fragrance</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="notes" id="notes" className="scroll-mt-28">
                <AccordionTrigger>Fragrance notes</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-sm ring-1 ring-rose-100/60">
                      <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                        {noteSections.map((section, index) => (
                          <div
                            key={section.id}
                            className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm"
                          >
                            <div
                              className={`absolute inset-0 -z-10 bg-gradient-to-br ${section.accent} opacity-80`}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-pink-500">
                                0{index + 1}
                              </span>
                              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.65rem] uppercase tracking-wide text-gray-500">
                                {section.caption}
                              </span>
                            </div>
                            <h4 className="mt-4 text-lg font-semibold text-gray-900">
                              {section.label}
                            </h4>
                            <ul className="mt-3 space-y-2 text-sm font-medium text-gray-800">
                              {section.notes.map((note) => (
                                <li key={note} className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                                  {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-pink-500">
                            Layering ritual
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-gray-900">
                            How to wear {product.title}
                          </h4>
                        </div>
                        <span className="hidden rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700 sm:inline-flex">
                          Evening ready
                        </span>
                      </div>
                      <ul className="mt-5 space-y-4 text-sm text-gray-600">
                        {layeringSuggestions.map((suggestion, index) => (
                          <li
                            key={`${suggestion.title}-${index}`}
                            className="flex gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                              {index + 1}
                            </span>
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-gray-800">
                                  {suggestion.title}
                                </p>
                                {suggestion.related ? (
                                  <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-pink-600">
                                    ${suggestion.related.price}
                                  </span>
                                ) : null}
                              </div>
                              <p>{suggestion.description}</p>
                              {suggestion.related ? (
                                <p className="text-xs text-gray-500">
                                  Pair with: {suggestion.related.name}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {product.related.length > 0 ? (
                        <div className="mt-6 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-pink-500">
                                Can be layered with
                              </p>
                              <p className="text-sm text-gray-600">
                                Add a second veil to deepen or brighten the accord.
                              </p>
                            </div>
                            <span className="hidden text-xs font-medium text-gray-400 sm:block">
                              Limited atelier allocations
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {product.related.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
                              >
                                <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-pink-600">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ${item.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
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
