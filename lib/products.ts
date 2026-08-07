"use client";

import { supabase } from "./supabase";

export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, category_id, categories(name)")
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.image_url,
    categoryId: p.category_id,
    categoryName: p.categories?.name ?? "Uncategorized",
  }));
}

const BUCKET = "product-images";
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 600;
export const MAX_GALLERY_IMAGES = 5;

// Resizes/crops any uploaded image to FILL an 800x600 box edge-to-edge
// (cover-fit), cropping whatever overflows. This keeps every card on the
// main site looking clean and consistent with no empty background gaps.
// If a photo has important content near its edges, crop it tighter before
// uploading so nothing important gets cut off.
export function resizeImageToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported in this browser."));
        return;
      }

      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
      const imgRatio = img.width / img.height;

      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;

      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to process the image."));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Could not load the selected image."));

    reader.readAsDataURL(file);
  });
}

// Uploads a resized image to Supabase Storage and updates the product's
// main cover image_url. Returns the new public URL.
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const resizedBlob = await resizeImageToBlob(file);
  const path = `${productId}.jpg`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, resizedBlob, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({ image_url: freshUrl })
    .eq("id", productId)
    .select("id");

  if (updateError) {
    console.error("Error updating product image_url:", updateError);
    throw updateError;
  }
  if (!updated || updated.length === 0) {
    throw new Error(
      "Image uploaded, but the product record wasn't updated (likely a permissions issue). Please check Supabase RLS policies on the products table."
    );
  }

  return freshUrl;
}

// ============================================
// Product photo gallery (extra photos shown on the product detail page,
// separate from the single main cover image above).
// ============================================

export type ProductGalleryImage = {
  id: string;
  imageUrl: string;
  sortOrder: number;
};

export async function getProductGallery(productId: string): Promise<ProductGalleryImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, image_url, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching product gallery:", error);
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  }));
}

export async function addProductGalleryImage(
  productId: string,
  file: File,
  sortOrder: number
): Promise<ProductGalleryImage> {
  const resizedBlob = await resizeImageToBlob(file);
  const path = `gallery/${productId}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, resizedBlob, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (uploadError) {
    console.error("Error uploading gallery image:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data: inserted, error: insertError } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_url: freshUrl, sort_order: sortOrder })
    .select("id, image_url, sort_order")
    .single();

  if (insertError) {
    console.error("Error saving gallery image record:", insertError);
    throw insertError;
  }

  return { id: inserted.id, imageUrl: inserted.image_url, sortOrder: inserted.sort_order };
}

export async function deleteProductGalleryImage(imageId: string): Promise<void> {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) {
    console.error("Error deleting gallery image:", error);
    throw error;
  }
}