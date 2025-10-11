import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Leaf,
  MessagesSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { AccountButton } from "@/components/account-button";
import { CartIndicator } from "@/components/cart-indicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHomePageData } from "@/data/home";
import { cn } from "@/lib/utils";

const highlightIconMap = {
  Sparkles,
  Leaf,
  MessagesSquare,
} satisfies Record<string, LucideIcon>;

type HighlightIconProps = {
  name: string;
};

function HighlightIcon({ name }: HighlightIconProps) {
  const Icon = highlightIconMap[name] ?? Sparkles;
  return <Icon className="h-5 w-5" aria-hidden="true" />;
}

export default async function Home() {
  const data = await getHomePageData();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-5">
          <Link
            href="/"
            className="text-lg font-semibold uppercase tracking-[0.2em]"
            aria-label="The Smelly Water Club — home"
          >
            The Smelly Water Club
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            <Link href="/products" className="transition hover:text-gray-900">
              Collection
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
            <AccountButton className="hidden sm:inline-flex" />
            <CartIndicator />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-20 px-4 pb-20 pt-12">
        <section className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white px-6 py-10 sm:px-10">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-white to-white" />
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-pink-100 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-pink-600">
                  {data.hero.eyebrow}
                </span>
                <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  {data.hero.heading}
                </h1>
                <p className="max-w-2xl text-base text-gray-600 md:text-lg">
                  {data.hero.subheading}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {data.hero.ctas.map((cta) => (
                  <Button
                    key={cta.label}
                    asChild
                    variant={cta.emphasis ? "default" : "outline"}
                    className={cta.emphasis ? "bg-pink-600 hover:bg-pink-700" : ""}
                  >
                    <Link href={cta.href} className="gap-2">
                      <span>{cta.label}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {data.highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-pink-600">
                        <HighlightIcon name={highlight.icon} />
                      </span>
                      {highlight.title}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-rose-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="text-xs uppercase tracking-[0.25em] text-pink-500">
                    Featured ritual
                  </p>
                  <div className="font-medium text-gray-900">
                    Layer Velour with Noir Atelier for an evening veil.
                  </div>
                  <p>
                    A two-step aura that settles into amber vanilla whispers
                    after midnight.
                  </p>
                </div>
                <Link
                  href="/products/velour-eau-de-parfum"
                  className="inline-flex items-center justify-center rounded-full border border-pink-500 px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-500 hover:text-white"
                >
                  Shop Velour
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Featured compositions
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Discover accords crafted for gatherings that begin with a whisper
                and end in laughter. Each profile is blended to evolve across the
                evening.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center text-sm font-medium text-pink-600 transition hover:text-pink-700"
            >
              Browse the full ritual wardrobe
              <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {data.featuredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[2rem] border border-gray-200 transition hover:-translate-y-1.5 hover:border-gray-300 hover:shadow-xl"
              >
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-2">
                    {product.badges.slice(0, 2).map((badge) => (
                      <Badge
                        key={badge}
                        className="border-none bg-pink-100 text-pink-700"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{product.title}</h3>
                    <p className="text-sm uppercase tracking-widest text-gray-400">
                      {product.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{product.rating.toFixed(1)} rating</span>
                    <span>{product.ratingsCount} reviews</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {product.variants.map((variant) => (
                      <Link
                        key={variant.id}
                        href={`/products/${product.slug}?variant=${encodeURIComponent(variant.id)}`}
                        className={cn(
                          "rounded-full border px-3 py-1 transition",
                          variant.stock > 0
                            ? "border-gray-200 hover:border-pink-200 hover:text-pink-600"
                            : "border-rose-600 bg-rose-600 text-white hover:border-rose-600 hover:bg-rose-600"
                        )}
                      >
                        {variant.stock > 0
                          ? `${variant.label} · $${variant.price}`
                          : `${variant.label} · Sold out`}
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      asChild
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                    >
                      <Link href={`/products/${product.slug}`}>Buy Now</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-gray-300"
                    >
                      <Link href={`/products/${product.slug}#notes`}>
                        Notes & layering
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-[2.5rem] bg-gray-50 px-6 py-10 sm:px-10 md:grid-cols-[1.15fr,0.85fr] md:gap-12 md:py-16">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Ritual blueprints
            </span>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Layering sequences to choreograph your night
            </h2>
            <p className="max-w-xl text-sm text-gray-600">
              Set the tone for salon conversations, twilight dinners, or the
              afterparty. Each ritual is designed by our scent concierge to
              bloom in stages.
            </p>
            <div className="space-y-6">
              {data.rituals.map((ritual) => (
                <div
                  key={ritual.id}
                  className="rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{ritual.title}</h3>
                      <p className="text-sm text-gray-500">{ritual.focus}</p>
                    </div>
                    <Link
                      href="/account"
                      className="inline-flex items-center text-sm font-medium text-pink-600 transition hover:text-pink-700"
                    >
                      Save to my ritual
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <ol className="mt-4 space-y-3 text-sm text-gray-600">
                    {ritual.steps.map((step, stepIndex) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-pink-100 text-center text-xs font-semibold leading-6 text-pink-700">
                          {stepIndex + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-700">
                            {step.title}
                          </p>
                          <p>{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden overflow-hidden rounded-[2rem] md:block">
            <Image
              src={data.rituals[0]?.illustration ?? data.hero.image}
              alt=""
              fill
              className="object-cover object-center"
            />
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              From the atelier journal
            </h2>
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-gray-700 transition hover:text-gray-900"
            >
              Sign in to bookmark stories
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {data.journal.map((entry) => (
              <article
                key={entry.id}
                className="group overflow-hidden rounded-[2rem] border border-gray-200 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
              >
                <div className="relative h-48">
                  <Image
                    src={entry.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-3 p-6">
                  <h3 className="text-lg font-semibold">{entry.title}</h3>
                  <p className="text-sm text-gray-600">{entry.excerpt}</p>
                  <Link
                    href={entry.href}
                    className="inline-flex items-center text-sm font-medium text-pink-600 transition hover:text-pink-700"
                  >
                    Continue reading
                    <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-gray-200 bg-gray-900 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr] md:items-center">
            <div className="space-y-5">
              <span className="text-xs uppercase tracking-[0.35em] text-pink-300">
                Membership
              </span>
              <h2 className="text-3xl font-semibold tracking-tight">
                {data.membership.headline}
              </h2>
              <p className="text-sm text-gray-200">
                {data.membership.subheadline}
              </p>
              <div className="grid gap-4">
                {data.membership.perks.map((perk) => (
                  <div
                    key={perk.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-medium">{perk.title}</p>
                    <p className="text-sm text-gray-300">{perk.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-gray-200">
                Members receive quarterly ritual kits curated by our scent
                director, invitations to live blending salons, and first access
                to limited releases.
              </p>
              <Button
                asChild
                className="w-full bg-pink-500 text-white hover:bg-pink-600"
              >
                <Link href="/login">
                  Become a member
                  <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Link
                href="/account"
                className="inline-flex items-center justify-center text-sm font-medium text-gray-200 transition hover:text-white"
              >
                Already joined? Manage your profile
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
