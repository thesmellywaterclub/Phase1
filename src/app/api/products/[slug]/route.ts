import { NextResponse } from "next/server";

import { getProductBySlug } from "@/data/products";

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}
