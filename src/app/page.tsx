import Image from "next/image";
import Link from "next/link";

import { CartIndicator } from "@/components/cart-indicator";
import { AccountButton } from "@/components/account-button";
import { products } from "@/data/products";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              The Smelly Water Club
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Explore the latest parfums and tailor your ritual.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products/velour-eau-de-parfum"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition hover:border-gray-400"
            >
              View featured
            </Link>
            <AccountButton />
            <CartIndicator />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-3xl border border-gray-200 p-4 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {product.subtitle}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {product.title}
                </h2>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <span>{product.badges[0]}</span>
                  <span>{product.rating.toFixed(1)} ★</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
