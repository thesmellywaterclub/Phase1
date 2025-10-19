import { notFound } from "next/navigation";

import {
  fetchProductBySlug,
  fetchProducts,
} from "@/data/products";
import { ProductDetail } from "@/components/product-detail";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const list = await fetchProducts({ limit: 64 }).catch(() => []);
  return list.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedCandidates = await fetchProducts({
    limit: 16,
    gender: product.gender,
  });

  const related = relatedCandidates
    .filter((item) => item.slug !== product.slug)
    .filter(
      (item) =>
        item.brand.id === product.brand.id || item.gender === product.gender,
    )
    .slice(0, 4);

  return <ProductDetail product={product} relatedProducts={related} />;
}
