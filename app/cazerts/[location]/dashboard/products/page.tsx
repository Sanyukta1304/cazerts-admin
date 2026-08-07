"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Loader2, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  getAdminProducts,
  uploadProductImage,
  getProductGallery,
  addProductGalleryImage,
  deleteProductGalleryImage,
  AdminProduct,
  ProductGalleryImage,
  MAX_GALLERY_IMAGES,
} from "@/lib/products";
import { getAdminCategories, uploadCategoryImage, AdminCategory } from "@/lib/categories";

export default function ProductsPage() {
  const params = useParams();
  const locationId = params.location as string;

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [galleries, setGalleries] = useState<Record<string, ProductGalleryImage[]>>({});
  const [galleryLoadingId, setGalleryLoadingId] = useState<string | null>(null);
  const [galleryUploadingId, setGalleryUploadingId] = useState<string | null>(null);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryUploadingId, setCategoryUploadingId] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const galleryInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const categoryInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch {
      setError("Couldn't load products. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    setCategoriesLoading(true);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch {
      setError("Couldn't load categories. Try refreshing.");
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  function triggerUpload(productId: string) {
    fileInputRefs.current[productId]?.click();
  }

  async function handleFileSelected(product: AdminProduct, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setUploadingId(product.id);

    const localPreviewUrl = URL.createObjectURL(file);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, imageUrl: localPreviewUrl } : p))
    );
    setBrokenImageIds((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });

    try {
      const finalUrl = await uploadProductImage(product.id, file);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, imageUrl: finalUrl } : p))
      );
      setJustUpdatedId(product.id);
      setTimeout(() => setJustUpdatedId(null), 2000);
    } catch (err: any) {
      setError(err?.message || `Failed to upload image for ${product.name}. Please try again.`);
      await load();
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleGallery(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);
    if (!galleries[productId]) {
      setGalleryLoadingId(productId);
      try {
        const images = await getProductGallery(productId);
        setGalleries((prev) => ({ ...prev, [productId]: images }));
      } catch {
        setError("Couldn't load gallery photos for this product.");
      } finally {
        setGalleryLoadingId(null);
      }
    }
  }

  function triggerGalleryUpload(productId: string) {
    galleryInputRefs.current[productId]?.click();
  }

  async function handleGalleryFileSelected(productId: string, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const current = galleries[productId] ?? [];
    if (current.length >= MAX_GALLERY_IMAGES) {
      setError(`You can only add up to ${MAX_GALLERY_IMAGES} gallery photos per product.`);
      return;
    }

    setError("");
    setGalleryUploadingId(productId);

    try {
      const nextSortOrder = current.length;
      const added = await addProductGalleryImage(productId, file, nextSortOrder);
      setGalleries((prev) => ({
        ...prev,
        [productId]: [...(prev[productId] ?? []), added],
      }));
    } catch {
      setError("Failed to add gallery photo. Please try again.");
    } finally {
      setGalleryUploadingId(null);
    }
  }

  async function handleDeleteGalleryImage(productId: string, imageId: string) {
    try {
      await deleteProductGalleryImage(imageId);
      setGalleries((prev) => ({
        ...prev,
        [productId]: (prev[productId] ?? []).filter((img) => img.id !== imageId),
      }));
    } catch {
      setError("Failed to remove that photo. Please try again.");
    }
  }

  function triggerCategoryUpload(categoryId: string) {
    categoryInputRefs.current[categoryId]?.click();
  }

  async function handleCategoryFileSelected(category: AdminCategory, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setCategoryUploadingId(category.id);

    const localPreviewUrl = URL.createObjectURL(file);
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, imageUrl: localPreviewUrl } : c))
    );

    try {
      const finalUrl = await uploadCategoryImage(category.id, file);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, imageUrl: finalUrl } : c))
      );
    } catch {
      setError(`Failed to upload image for ${category.name}. Please try again.`);
      await loadCategories();
    } finally {
      setCategoryUploadingId(null);
    }
  }

  const grouped = products.reduce<Record<string, AdminProduct[]>>((acc, p) => {
    (acc[p.categoryName] ??= []).push(p);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          CAZERTS
        </p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2">Product Photos</h1>
        <p className="text-black/50 text-sm mb-8">
          Upload photos for products and category covers — resized automatically and shown live on the website.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {/* Category cover photos */}
        <div className="mb-12">
          <h2 className="font-display font-bold text-lg mb-4">Category Covers</h2>
          {categoriesLoading ? (
            <p className="text-black/40 text-sm">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-2xl overflow-hidden shadow-card">
                  <div className="relative aspect-[3/4] bg-black/5">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/20 text-xs text-center px-2">
                        No cover photo
                      </div>
                    )}
                    {categoryUploadingId === category.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={22} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-black text-xs mb-2 truncate">{category.name}</p>
                    <input
                      ref={(el) => {
                        categoryInputRefs.current[category.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCategoryFileSelected(category, e.target.files?.[0])}
                    />
                    <button
                      onClick={() => triggerCategoryUpload(category.id)}
                      disabled={categoryUploadingId === category.id}
                      className="w-full inline-flex items-center justify-center gap-1 bg-black text-white text-[11px] font-semibold px-3 py-2 rounded-full hover:bg-black/80 transition disabled:opacity-50"
                    >
                      <ImagePlus size={12} />
                      {category.imageUrl ? "Replace" : "Upload"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-black/40 text-sm">Loading products...</p>
        ) : (
          Object.entries(grouped).map(([categoryName, items]) => (
            <div key={categoryName} className="mb-10">
              <h2 className="font-display font-bold text-lg mb-4">{categoryName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((product) => {
                  const gallery = galleries[product.id] ?? [];
                  const isExpanded = expandedId === product.id;

                  return (
                    <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-card">
                      <div className="relative aspect-[4/3] bg-black/5">
                        {product.imageUrl && !brokenImageIds.has(product.id) ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={() =>
                              setBrokenImageIds((prev) => new Set(prev).add(product.id))
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black/20 text-sm">
                            No photo yet
                          </div>
                        )}

                        {uploadingId === product.id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 size={28} className="text-white animate-spin" />
                          </div>
                        )}

                        {justUpdatedId === product.id && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5">
                            <Check size={14} />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-black text-sm mb-1 truncate">{product.name}</h3>
                        <p className="text-black/40 text-xs mb-3">₹{product.price}</p>

                        <input
                          ref={(el) => {
                            fileInputRefs.current[product.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelected(product, e.target.files?.[0])}
                        />
                        <button
                          onClick={() => triggerUpload(product.id)}
                          disabled={uploadingId === product.id}
                          className="w-full inline-flex items-center justify-center gap-2 bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-black/80 transition disabled:opacity-50 mb-2"
                        >
                          <ImagePlus size={14} />
                          {product.imageUrl ? "Replace Main Photo" : "Upload Main Photo"}
                        </button>

                        <button
                          onClick={() => toggleGallery(product.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-black/60 text-xs font-semibold px-4 py-2 rounded-full hover:bg-black/5 transition"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          Manage Gallery ({gallery.length}/{MAX_GALLERY_IMAGES})
                        </button>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-black/5">
                            {galleryLoadingId === product.id ? (
                              <p className="text-black/30 text-xs">Loading gallery...</p>
                            ) : (
                              <>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  {gallery.map((img) => (
                                    <div
                                      key={img.id}
                                      className="relative aspect-square rounded-lg overflow-hidden bg-black/5 group"
                                    >
                                      <img
                                        src={img.imageUrl}
                                        alt="Gallery photo"
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={() => handleDeleteGalleryImage(product.id, img.id)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        aria-label="Remove photo"
                                      >
                                        <Trash2 size={16} className="text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <input
                                  ref={(el) => {
                                    galleryInputRefs.current[product.id] = el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleGalleryFileSelected(product.id, e.target.files?.[0])
                                  }
                                />
                                <button
                                  onClick={() => triggerGalleryUpload(product.id)}
                                  disabled={
                                    gallery.length >= MAX_GALLERY_IMAGES ||
                                    galleryUploadingId === product.id
                                  }
                                  className="w-full inline-flex items-center justify-center gap-1.5 bg-black/5 text-black text-xs font-semibold px-4 py-2 rounded-full hover:bg-black/10 transition disabled:opacity-40"
                                >
                                  {galleryUploadingId === product.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <ImagePlus size={13} />
                                  )}
                                  Add Gallery Photo
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}