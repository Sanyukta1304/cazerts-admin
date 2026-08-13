"use client";

import { supabase } from "./supabase";

export type InventoryProduct = {
  productId: string;
  name: string;
  price: number;
  category: string;
  // null = stock has never been set for this product, treated as
  // unlimited/in-stock until an admin sets an explicit quantity.
  stock: number | null;
  inStock: boolean;
};

// Fetches every product across every category, joined with whatever
// stock quantity (if any) has been set for it.
export async function getAllInventory(): Promise<InventoryProduct[]> {
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, categories(name)")
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

  return (products ?? []).map((p: any) => {
    const stock = stockMap.has(p.id) ? stockMap.get(p.id)! : null;
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      category: p.categories?.name ?? "Uncategorized",
      stock,
      // No row at all = never been tracked = in stock. Otherwise
      // in stock only if the tracked quantity is above zero.
      inStock: stock === null || stock > 0,
    };
  });
}

// Sets an exact stock quantity for a product. Pass 0 to mark it
// out of stock. Used by the admin Inventory page for every category.
export async function setProductStock(productId: string, quantity: number): Promise<void> {
  const safeQty = Math.max(0, Math.floor(quantity));
  const { error } = await supabase
    .from("inventory")
    .upsert(
      { product_id: productId, stock: safeQty, updated_at: new Date().toISOString() },
      { onConflict: "product_id" }
    );

  if (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
}

// Looks up current stock for a set of product ids in one call — used
// by the main site (product page / cart) and the admin Pickup page
// to check availability before confirming a quantity.
export async function getStockForProducts(
  productIds: string[]
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (productIds.length === 0) return result;

  const { data, error } = await supabase
    .from("inventory")
    .select("product_id, stock")
    .in("product_id", productIds);

  if (error) {
    console.error("Error fetching stock:", error);
    throw error;
  }

  for (const id of productIds) result.set(id, null);
  for (const row of data ?? []) {
    result.set(row.product_id, row.stock);
  }
  return result;
}

// Reduces stock after an order is placed, so admin and the main site
// stay in sync automatically. Only affects products that already have
// a tracked stock row — untracked products stay unlimited. Never goes
// below 0.
export async function decrementStock(productId: string, qty: number): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("inventory")
    .select("stock")
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error reading stock before decrement:", fetchError);
    throw fetchError;
  }

  // Not tracked — nothing to decrement.
  if (!data) return;

  const newStock = Math.max(0, data.stock - qty);
  const { error: updateError } = await supabase
    .from("inventory")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("product_id", productId);

  if (updateError) {
    console.error("Error decrementing stock:", updateError);
    throw updateError;
  }
}