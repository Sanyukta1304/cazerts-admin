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