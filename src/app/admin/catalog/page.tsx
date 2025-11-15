"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch, ApiError, type ApiResponseEnvelope } from "@/lib/api-client";
import { formatPaise } from "@/lib/money";

const genders = [
  { value: "unisex", label: "Unisex" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "other", label: "Other" },
] as const;

type BrandSummary = {
  id: string;
  name: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

type ProductResponse = {
  id: string;
  title: string;
  slug: string;
  brand: {
    id: string;
    name: string;
  };
};

type ProductListResponse = {
  data: ProductResponse[];
  meta: {
    nextCursor: string | null;
  };
};

type ProductMediaItem = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductVariantSummary = {
  id: string;
  sku: string;
  sizeMl: number;
  mrpPaise: number;
  salePaise: number | null;
  isActive: boolean;
};

type FormStatus = { type: "success" | "error"; message: string } | null;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message =
      ((error.body as { error?: { message?: string } } | null)?.error?.message ??
        error.message)
        .toString()
        .trim();
    return message || "Request failed. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

function parseNotesField(value: string): string[] {
  return value
    .split(",")
    .map((note) => note.trim())
    .filter((note) => note.length > 0);
}

function formatDate(value: string): string {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return value;
  }
}

const emptyProductForm = {
  title: "",
  slug: "",
  brandId: "",
  gender: genders[0]?.value ?? "unisex",
  description: "",
  notesTop: "",
  notesHeart: "",
  notesBase: "",
};

export default function AdminCatalogPage() {
  const token = useAuthStore((state) => state.token);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandStatus, setBrandStatus] = useState<FormStatus>(null);
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productStatus, setProductStatus] = useState<FormStatus>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mediaProductId, setMediaProductId] = useState("");
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<FormStatus>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [variantBrandId, setVariantBrandId] = useState("");
  const [variantProductId, setVariantProductId] = useState("");
  const [variantItems, setVariantItems] = useState<ProductVariantSummary[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantStatus, setVariantStatus] = useState<FormStatus>(null);
  const [variantForm, setVariantForm] = useState({
    sku: "",
    sizeMl: "",
    mrpPaise: "",
    salePaise: "",
  });

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name)),
    [brands]
  );
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === mediaProductId) ?? null,
    [products, mediaProductId]
  );
  const selectedVariantProduct = useMemo(
    () => products.find((product) => product.id === variantProductId) ?? null,
    [products, variantProductId]
  );
  const variantProductOptions = useMemo(
    () =>
      products.filter((product) =>
        variantBrandId ? product.brand.id === variantBrandId : true,
      ),
    [products, variantBrandId]
  );

  useEffect(() => {
    if (
      variantProductId &&
      variantBrandId &&
      selectedVariantProduct &&
      selectedVariantProduct.brand.id !== variantBrandId
    ) {
      setVariantProductId("");
      setVariantItems([]);
    }
  }, [variantBrandId, variantProductId, selectedVariantProduct]);

  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const response = await apiFetch<ApiResponseEnvelope<BrandSummary[]>>("/api/brands");
        setBrands(response.data);
      } catch (error) {
        console.error("Failed to load brands", error);
        setBrandsError(getApiErrorMessage(error));
      } finally {
        setBrandsLoading(false);
      }
    };

    void fetchBrands();
  }, []);

  useEffect(() => {
    const fetchProductsList = async () => {
      setProductsLoading(true);
      try {
        const response = await apiFetch<ProductListResponse>("/api/products?limit=50&isActive=true");
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setProductsLoading(false);
      }
    };

    void fetchProductsList();
  }, []);

  const refreshBrands = async () => {
    try {
      const response = await apiFetch<ApiResponseEnvelope<BrandSummary[]>>("/api/brands");
      setBrands(response.data);
    } catch (error) {
      console.error("Failed to refresh brands", error);
    }
  };

  const loadMediaForProduct = async (productId: string) => {
    if (!token) {
      setMediaError("Session expired. Please sign in again.");
      return;
    }
    setMediaLoading(true);
    setMediaError(null);
    setMediaStatus(null);
    try {
      const response = await apiFetch<ApiResponseEnvelope<ProductMediaItem[]>>(
        `/api/products/${productId}/media`,
        { token }
      );
      setMediaItems(response.data);
      setAltDrafts(
        response.data.reduce<Record<string, string>>((drafts, item) => {
          drafts[item.id] = item.alt ?? "";
          return drafts;
        }, {})
      );
    } catch (error) {
      setMediaError(getApiErrorMessage(error));
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSelectMediaProduct = (value: string) => {
    setMediaProductId(value);
    setMediaItems([]);
    if (value) {
      void loadMediaForProduct(value);
    } else {
      setAltDrafts({});
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!mediaProductId) {
      setMediaStatus({ type: "error", message: "Select a product first." });
      return;
    }
    if (!token) {
      setMediaStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMediaStatus({ type: "error", message: "Only image uploads are supported." });
      return;
    }

    setUploading(true);
    setMediaStatus(null);
    try {
      const presign = await apiFetch<
        ApiResponseEnvelope<{ uploadUrl: string; fileUrl: string }>
      >(`/api/products/${mediaProductId}/media/presign`, {
        method: "POST",
        token,
        json: {
          contentType: file.type,
          fileName: file.name,
        },
      });

      await fetch(presign.data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      await apiFetch<ApiResponseEnvelope<ProductMediaItem>>(
        `/api/products/${mediaProductId}/media`,
        {
          method: "POST",
          token,
          json: {
            url: presign.data.fileUrl,
            alt: selectedProduct ? `${selectedProduct.title} image` : file.name,
          },
        }
      );

      setMediaStatus({
        type: "success",
        message: `${file.name} uploaded successfully.`,
      });
      await loadMediaForProduct(mediaProductId);
    } catch (error) {
      setMediaStatus({ type: "error", message: getApiErrorMessage(error) });
    } finally {
      setUploading(false);
    }
  };

  const handleAltChange = (mediaId: string, value: string) => {
    setAltDrafts((prev) => ({ ...prev, [mediaId]: value }));
  };

  const handleSaveAlt = async (mediaId: string) => {
    if (!token || !mediaProductId) {
      setMediaStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    const alt = altDrafts[mediaId] ?? "";
    try {
      await apiFetch<ApiResponseEnvelope<ProductMediaItem>>(
        `/api/products/${mediaProductId}/media/${mediaId}`,
        {
          method: "PATCH",
          token,
          json: { alt },
        }
      );
      setMediaStatus({ type: "success", message: "Saved caption." });
      setMediaItems((items) =>
        items.map((item) =>
          item.id === mediaId ? { ...item, alt } : item
        )
      );
    } catch (error) {
      setMediaStatus({ type: "error", message: getApiErrorMessage(error) });
    }
  };

  const handleMakeHero = async (mediaId: string) => {
    if (!token || !mediaProductId) {
      setMediaStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    try {
      await apiFetch<ApiResponseEnvelope<ProductMediaItem>>(
        `/api/products/${mediaProductId}/media/${mediaId}`,
        {
          method: "PATCH",
          token,
          json: { isPrimary: true },
        }
      );
      setMediaStatus({ type: "success", message: "Marked as hero image." });
      await loadMediaForProduct(mediaProductId);
    } catch (error) {
      setMediaStatus({ type: "error", message: getApiErrorMessage(error) });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!token || !mediaProductId) {
      setMediaStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    try {
      await apiFetch<void>(`/api/products/${mediaProductId}/media/${mediaId}`, {
        method: "DELETE",
        token,
      });
      setMediaStatus({ type: "success", message: "Image removed." });
      await loadMediaForProduct(mediaProductId);
    } catch (error) {
      setMediaStatus({ type: "error", message: getApiErrorMessage(error) });
    }
  };

  const handleUploadClick = () => {
    if (!mediaProductId) {
      setMediaStatus({ type: "error", message: "Select a product first." });
      return;
    }
    fileInputRef.current?.click();
  };

  const loadVariantsForProduct = async (productId: string) => {
    if (!token) {
      setVariantStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    setVariantLoading(true);
    setVariantStatus(null);
    try {
      const response = await apiFetch<ApiResponseEnvelope<ProductVariantSummary[]>>(
        `/api/products/${productId}/variants`,
        { token }
      );
      setVariantItems(response.data);
    } catch (error) {
      setVariantStatus({ type: "error", message: getApiErrorMessage(error) });
      setVariantItems([]);
    } finally {
      setVariantLoading(false);
    }
  };

  const handleSelectVariantProduct = (value: string) => {
    setVariantProductId(value);
    setVariantItems([]);
    if (value) {
      void loadVariantsForProduct(value);
    }
  };

  const handleSelectVariantBrand = (value: string) => {
    setVariantBrandId(value);
  };

  const handleVariantFieldChange = (
    field: keyof typeof variantForm,
    value: string,
  ) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVariantStatus(null);
    if (!token) {
      setVariantStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }
    if (!variantProductId) {
      setVariantStatus({ type: "error", message: "Select a product first." });
      return;
    }

    const sizeMl = Number.parseInt(variantForm.sizeMl, 10);
    const mrpRupees = Number.parseFloat(variantForm.mrpPaise);
    const saleRupees =
      variantForm.salePaise.trim().length > 0
        ? Number.parseFloat(variantForm.salePaise)
        : undefined;
    const mrpPaise = Number.isNaN(mrpRupees) ? Number.NaN : Math.round(mrpRupees * 100);
    const salePaise =
      saleRupees !== undefined && !Number.isNaN(saleRupees)
        ? Math.round(saleRupees * 100)
        : undefined;

    if (
      !variantForm.sku.trim() ||
      Number.isNaN(sizeMl) ||
      Number.isNaN(mrpPaise)
    ) {
      setVariantStatus({
        type: "error",
        message: "SKU, size, and MRP (in rupees) are required and must be valid numbers.",
      });
      return;
    }

    try {
      await apiFetch<ApiResponseEnvelope<ProductVariantSummary>>(
        `/api/products/${variantProductId}/variants`,
        {
          method: "POST",
          token,
          json: {
            sku: variantForm.sku.trim(),
            sizeMl,
            mrpPaise,
            salePaise,
          },
        }
      );
      setVariantStatus({ type: "success", message: "Variant created." });
      setVariantForm({
        sku: "",
        sizeMl: "",
        mrpPaise: "",
        salePaise: "",
      });
      await loadVariantsForProduct(variantProductId);
    } catch (error) {
      setVariantStatus({ type: "error", message: getApiErrorMessage(error) });
    }
  };

  const handleCreateBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBrandStatus(null);

    const trimmed = brandName.trim();
    if (!trimmed) {
      setBrandStatus({ type: "error", message: "Enter a brand name." });
      return;
    }
    if (!token) {
      setBrandStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }

    setBrandSubmitting(true);
    try {
      const response = await apiFetch<ApiResponseEnvelope<BrandSummary>>("/api/brands", {
        method: "POST",
        token,
        json: { name: trimmed },
      });
      setBrandStatus({ type: "success", message: `Created ${response.data.name}.` });
      setBrandName("");
      await refreshBrands();
    } catch (error) {
      setBrandStatus({ type: "error", message: getApiErrorMessage(error) });
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleProductChange = (field: keyof typeof productForm, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateSlug = () => {
    setProductForm((prev) => {
      const source = prev.slug ? prev.slug : prev.title;
      const slug = source
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      return { ...prev, slug };
    });
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductStatus(null);

    if (!token) {
      setProductStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }

    const payload = {
      title: productForm.title.trim(),
      slug: productForm.slug.trim(),
      brandId: productForm.brandId,
      gender: productForm.gender,
      description: productForm.description.trim() || undefined,
    } as {
      title: string;
      slug: string;
      brandId: string;
      gender: string;
      description?: string;
      notes?: {
        top: string[];
        heart: string[];
        base: string[];
      };
    };

    if (!payload.title || !payload.slug || !payload.brandId) {
      setProductStatus({ type: "error", message: "Fill in the required fields." });
      return;
    }

    const notes = {
      top: parseNotesField(productForm.notesTop),
      heart: parseNotesField(productForm.notesHeart),
      base: parseNotesField(productForm.notesBase),
    };

    if (notes.top.length || notes.heart.length || notes.base.length) {
      payload.notes = notes;
    }

    setProductSubmitting(true);
    try {
      const response = await apiFetch<ApiResponseEnvelope<ProductResponse>>("/api/products", {
        method: "POST",
        token,
        json: payload,
      });
      setProductStatus({
        type: "success",
        message: `Created ${response.data.title} (${response.data.slug}).`,
      });
      setProductForm({ ...emptyProductForm, brandId: productForm.brandId });
      await refreshBrands();
    } catch (error) {
      setProductStatus({ type: "error", message: getApiErrorMessage(error) });
    } finally {
      setProductSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Create a brand</CardTitle>
          <CardDescription>
            Keep the naming consistent with how it should appear on the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateBrand}>
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="e.g. Atelier Nimbus"
              />
            </div>
            {brandStatus ? (
              <p
                className={`text-sm ${
                  brandStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {brandStatus.message}
              </p>
            ) : null}
            <Button type="submit" disabled={brandSubmitting}>
              {brandSubmitting ? "Saving…" : "Save brand"}
            </Button>
      </form>
    </CardContent>
  </Card>

  <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Add a product</CardTitle>
          <CardDescription>
            Tie your product to an existing brand, then enrich it with copy and fragrance notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateProduct}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-title">Title</Label>
                <Input
                  id="product-title"
                  value={productForm.title}
                  onChange={(event) => handleProductChange("title", event.target.value)}
                  placeholder="Velvet Dawn Extrait"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-slug">Slug</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-pink-600 hover:underline"
                    onClick={handleGenerateSlug}
                  >
                    Auto-fill
                  </button>
                </div>
                <Input
                  id="product-slug"
                  value={productForm.slug}
                  onChange={(event) => handleProductChange("slug", event.target.value)}
                  placeholder="velvet-dawn-extrait"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand-select">Brand</Label>
                <select
                  id="brand-select"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={productForm.brandId}
                  onChange={(event) => handleProductChange("brandId", event.target.value)}
                  disabled={brandsLoading || sortedBrands.length === 0}
                >
                  <option value="">Select a brand</option>
                  {sortedBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-gender">Audience</Label>
                <select
                  id="product-gender"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={productForm.gender}
                  onChange={(event) => handleProductChange("gender", event.target.value)}
                >
                  {genders.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <textarea
                id="product-description"
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={productForm.description}
                onChange={(event) => handleProductChange("description", event.target.value)}
                placeholder="Short story that highlights the mood, inspiration, and key accords."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="notes-top">Top notes</Label>
                <Input
                  id="notes-top"
                  value={productForm.notesTop}
                  onChange={(event) => handleProductChange("notesTop", event.target.value)}
                  placeholder="bergamot, pear, saffron"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes-heart">Heart notes</Label>
                <Input
                  id="notes-heart"
                  value={productForm.notesHeart}
                  onChange={(event) => handleProductChange("notesHeart", event.target.value)}
                  placeholder="rose absolue, suede"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes-base">Base notes</Label>
                <Input
                  id="notes-base"
                  value={productForm.notesBase}
                  onChange={(event) => handleProductChange("notesBase", event.target.value)}
                  placeholder="sandalwood, tonka, amber"
                />
              </div>
            </div>
            {productStatus ? (
              <p
                className={`text-sm ${
                  productStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {productStatus.message}
              </p>
            ) : null}
            <Button type="submit" disabled={productSubmitting}>
              {productSubmitting ? "Creating…" : "Create product"}
            </Button>
            <p className="text-xs text-slate-500">
              Variants and imagery can be added after the product shell is in place.
            </p>
          </form>
    </CardContent>
  </Card>

  <Card className="border-slate-200">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-slate-900">
        Product variants
      </CardTitle>
      <CardDescription>
        Define bottle sizes and SKUs so sellers can attach offers to the catalog.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="variant-brand-selector">Select brand</Label>
          <select
            id="variant-brand-selector"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={variantBrandId}
            onChange={(event) => handleSelectVariantBrand(event.target.value)}
            disabled={brandsLoading}
          >
            <option value="">All brands</option>
            {sortedBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-product-selector">Select product</Label>
          <select
            id="variant-product-selector"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={variantProductId}
            onChange={(event) => handleSelectVariantProduct(event.target.value)}
            disabled={productsLoading || variantProductOptions.length === 0}
          >
            <option value="">
              {productsLoading
                ? "Loading products…"
                : variantProductOptions.length
                  ? "Choose a product"
                  : "No products for this brand"}
            </option>
            {variantProductOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Selected</Label>
          <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            {selectedVariantProduct ? selectedVariantProduct.title : "No product selected"}
          </p>
        </div>
      </div>

      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreateVariant}>
        <div className="space-y-2">
          <Label htmlFor="variant-sku">SKU</Label>
          <Input
            id="variant-sku"
            value={variantForm.sku}
            onChange={(event) => handleVariantFieldChange("sku", event.target.value)}
            placeholder="DIOR-SAU-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-size">Size (ml)</Label>
          <Input
            id="variant-size"
            type="number"
            value={variantForm.sizeMl}
            onChange={(event) => handleVariantFieldChange("sizeMl", event.target.value)}
            placeholder="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-mrp">MRP (₹)</Label>
          <Input
            id="variant-mrp"
            type="number"
            step="0.01"
            value={variantForm.mrpPaise}
            onChange={(event) => handleVariantFieldChange("mrpPaise", event.target.value)}
            placeholder="9500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-sale">Sale price (₹)</Label>
          <Input
            id="variant-sale"
            type="number"
            step="0.01"
            value={variantForm.salePaise}
            onChange={(event) => handleVariantFieldChange("salePaise", event.target.value)}
            placeholder="8990"
          />
        </div>
        <div className="md:col-span-4">
          <Button type="submit" disabled={!variantProductId}>
            Add variant
          </Button>
        </div>
      </form>

      {variantStatus ? (
        <p
          className={`text-sm ${
            variantStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {variantStatus.message}
        </p>
      ) : null}

      {variantProductId ? (
        variantLoading ? (
          <p className="text-sm text-slate-500">Loading variants…</p>
        ) : variantItems.length ? (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Size (ml)</th>
                <th className="px-3 py-2">MRP</th>
                <th className="px-3 py-2">Sale</th>
              </tr>
            </thead>
            <tbody>
              {variantItems.map((variant) => (
                <tr key={variant.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{variant.sku}</td>
                  <td className="px-3 py-2 text-slate-600">{variant.sizeMl} ml</td>
                  <td className="px-3 py-2 text-slate-600">{formatPaise(variant.mrpPaise)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {variant.salePaise ? formatPaise(variant.salePaise) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">
            No variants yet. Add at least one so sellers can publish offers.
          </p>
        )
      ) : (
        <p className="text-sm text-slate-500">
          Select a product to manage its variants.
        </p>
      )}
    </CardContent>
  </Card>

  <Card className="border-slate-200">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-slate-900">
        Product media
      </CardTitle>
      <CardDescription>
        Upload hero and gallery images to the S3 bucket, then manage captions and hero status.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-selector">Select product</Label>
          <select
            id="product-selector"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={mediaProductId}
            onChange={(event) => handleSelectMediaProduct(event.target.value)}
            disabled={productsLoading}
          >
            <option value="">
              {productsLoading ? "Loading products…" : "Choose a product"}
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          {mediaError ? (
            <p className="text-sm text-rose-600">{mediaError}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Upload image</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleUploadClick}
              disabled={!mediaProductId || uploading || mediaLoading}
            >
              {uploading ? "Uploading…" : "Select file"}
            </Button>
            <p className="text-xs text-slate-500">
              PNG, JPG, or WEBP up to 5 MB.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileSelection}
          />
        </div>
      </div>
      {mediaStatus ? (
        <p
          className={`text-sm ${
            mediaStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {mediaStatus.message}
        </p>
      ) : null}
      {mediaProductId ? (
        mediaLoading ? (
          <p className="text-sm text-slate-500">Loading media…</p>
        ) : mediaItems.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mediaItems.map((item) => (
              <li
                key={item.id}
                className="space-y-3 rounded-2xl border border-slate-200 p-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.alt ?? "Product media"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {item.isPrimary ? (
                    <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Hero
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`alt-${item.id}`}>Alt text</Label>
                  <Input
                    id={`alt-${item.id}`}
                    value={altDrafts[item.id] ?? ""}
                    onChange={(event) => handleAltChange(item.id, event.target.value)}
                    onBlur={() => handleSaveAlt(item.id)}
                    placeholder="Describe the image"
                  />
                  <div className="flex flex-wrap gap-2">
                    {!item.isPrimary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeHero(item.id)}
                      >
                        Make hero
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMedia(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            No images yet. Upload the first hero image for this product.
          </p>
        )
      ) : (
        <p className="text-sm text-slate-500">
          Select a product to manage its gallery.
        </p>
      )}
    </CardContent>
  </Card>

  <Card className="border-slate-200">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-slate-900">
        Brands overview
          </CardTitle>
          <CardDescription>
            Quick snapshot of everything that is currently available in the catalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <p className="text-sm text-slate-500">Loading brands…</p>
          ) : brandsError ? (
            <p className="text-sm text-rose-600">{brandsError}</p>
          ) : sortedBrands.length === 0 ? (
            <p className="text-sm text-slate-500">No brands yet. Create one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Brand</th>
                    <th className="px-3 py-2">Products</th>
                    <th className="px-3 py-2">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBrands.map((brand) => (
                    <tr key={brand.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-900">{brand.name}</td>
                      <td className="px-3 py-2 text-slate-600">{brand.productCount}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(brand.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sortedBrands.length > 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Need to adjust an existing brand? Open a ticket while we wire editing controls.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Next steps
          </CardTitle>
          <CardDescription>
            After creating the product shell, head to the seller console or reach out to ops.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            • Share the new SKU ID with trusted sellers so they can publish inaugural offers.
          </p>
          <p>
            • Upload lifestyle + pack shots via the content tools (coming soon) or seed data manually.
          </p>
          <p>
            • Circle back to this page anytime to monitor catalog coverage.
          </p>
          <Button asChild variant="outline">
            <Link href="/seller">Jump to seller tools</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
