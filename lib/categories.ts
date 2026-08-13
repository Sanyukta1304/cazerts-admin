"use client";

import { supabase } from "./supabase";
import { resizeImageToBlob } from "./products";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.image_url,
  }));
}

const BUCKET = "product-images"; // reusing the same bucket, different prefix

export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const resizedBlob = await resizeImageToBlob(file);
  const path = `categories/${categoryId}.jpg`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, resizedBlob, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (uploadError) {
    console.error("Error uploading category image:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data: updated, error: updateError } = await supabase
    .from("categories")
    .update({ image_url: freshUrl })
    .eq("id", categoryId)
    .select("id");

  if (updateError) {
    console.error("Error updating category image_url:", updateError);
    throw updateError;
  }
  if (!updated || updated.length === 0) {
    throw new Error(
      "Image uploaded, but the category record wasn't updated (likely a permissions issue)."
    );
  }

  return freshUrl;
}

// Creates a new category, deriving a URL-safe slug from the name.
// Returns the new category so the caller can immediately select it.
export async function createCategory(name: string): Promise<AdminCategory> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Category name can't be empty.");
  }
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: trimmed, slug })
    .select("id, name, slug, image_url")
    .single();

  if (error) {
    console.error("Error creating category:", error);
    throw error;
  }

  return { id: data.id, name: data.name, slug: data.slug, imageUrl: data.image_url };
}

// Deletes a category. Refuses if any products still belong to it, so you
// don't end up with orphaned products or a foreign-key error — move or
// delete those products first, then delete the category.
export async function deleteCategory(categoryId: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    console.error("Error checking products in category:", countError);
    throw countError;
  }
  if (count && count > 0) {
    throw new Error(
      `This category still has ${count} product${count === 1 ? "" : "s"} in it. Move or delete ${
        count === 1 ? "it" : "them"
      } first, then delete the category.`
    );
  }

  // Best-effort cleanup of the cover image file in storage.
  const { data: categoryRow } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", categoryId)
    .single();

  const coverPath = categoryRow?.image_url ? extractStoragePath(categoryRow.image_url) : null;
  if (coverPath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([coverPath]);
    if (storageError) {
      console.error("Error removing category cover from storage:", storageError);
      // continue anyway — DB cleanup matters more than an orphaned storage file
    }
  }

  const { error: deleteError, data: deleted } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .select("id");

  if (deleteError) {
    console.error("Error deleting category:", deleteError);
    throw deleteError;
  }
  if (!deleted || deleted.length === 0) {
    throw new Error(
      "Category wasn't deleted (likely a permissions issue). Please check Supabase RLS policies on the categories table."
    );
  }
}

// Public Supabase Storage URLs look like:
// https://xxxx.supabase.co/storage/v1/object/public/product-images/<path>?t=123
// This pulls out just <path> so we can pass it to storage.remove().
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const afterBucket = publicUrl.slice(idx + marker.length);
  return afterBucket.split("?")[0] || null;
}