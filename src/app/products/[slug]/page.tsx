import { notFound } from "next/navigation";

import { getProductBySlug, products } from "@/data/products";
import { ProductDetail } from "@/components/product-detail";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
