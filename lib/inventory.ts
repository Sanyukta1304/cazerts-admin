"use client";

import { supabase } from "./supabase";

export type InventoryProduct = {
  productId: string;
  name: string;
  price: number;
  inStock: boolean;
};

// Scoped to Cake Cans for now — pass a different category name later
// (or drop the filter) to extend this to other product types.
const TRACKED_CATEGORY = "Cake Cans";

export async function getTrackedInventory(): Promise<InventoryProduct[]> {
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", TRACKED_CATEGORY)
    .maybeSingle();

  if (categoryError) {
    console.error("Error finding category:", categoryError);
    throw categoryError;
  }
  if (!category) return [];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("category_id", category.id)
    .order("name");

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw productsError;
  }

  const { data: inventoryRows, error: inventoryError } = await supabase
    .from("inventory")
    .select("product_id, stock");

  if (inventoryError) {
    console.error("Error fetching inventory:", inventoryError);
    throw inventoryError;
  }

  const stockMap = new Map<string, number>();
  for (const row of inventoryRows ?? []) {
    stockMap.set(row.product_id, row.stock);
  }

  return (products ?? []).map((p: any) => ({
    productId: p.id,
    name: p.name,
    price: p.price,
    // No inventory row at all = never been marked out of stock = in stock.
    inStock: !stockMap.has(p.id) || stockMap.get(p.id)! > 0,
  }));
}

export async function setProductStock(productId: string, inStock: boolean): Promise<void> {
  const { error } = await supabase
    .from("inventory")
    .upsert(
      { product_id: productId, stock: inStock ? 1 : 0, updated_at: new Date().toISOString() },
      { onConflict: "product_id" }
    );

  if (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
}