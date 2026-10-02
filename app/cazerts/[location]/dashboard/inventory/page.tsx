"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PackageX,
  PackageCheck,
  Minus,
  Plus,
  MoreVertical,
} from "lucide-react";
import {
  getAllInventory,
  setProductStock,
  InventoryProduct,
} from "@/lib/inventory";

export default function InventoryPage() {
  const params = useParams();
  const locationId = params.location as string;

  const [items, setItems] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Draft quantity typed into each row's input
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Product whose three-dot menu is currently open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const data = await getAllInventory();
      setItems(data);

      const nextDrafts: Record<string, string> = {};

      for (const item of data) {
        nextDrafts[item.productId] =
          item.stock === null ? "" : String(item.stock);
      }

      setDrafts(nextDrafts);
    } catch {
      setError("Couldn't load inventory. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveQuantity(
    item: InventoryProduct,
    quantity: number | null
  ) {
    setUpdatingId(item.productId);
    setError("");
    setOpenMenuId(null);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.productId === item.productId
          ? {
              ...i,
              stock: quantity,
              inStock: quantity === null ? true : quantity > 0,
            }
          : i
      )
    );

    setDrafts((prev) => ({
      ...prev,
      [item.productId]: quantity === null ? "" : String(quantity),
    }));

   try {
  if (quantity === null) {
    setError(`Please enter a valid quantity for ${item.name}.`);
    return;
  }

  await setProductStock(item.productId, quantity);
} catch {
  setError(`Failed to update ${item.name}. Please try again.`);
  await load();
}finally {
      setUpdatingId(null);
    }
  }

  function handleDraftChange(productId: string, value: string) {
    // Only allow digits
    if (value !== "" && !/^\d+$/.test(value)) return;

    setDrafts((prev) => ({
      ...prev,
      [productId]: value,
    }));
  }

  function handleDraftBlur(item: InventoryProduct) {
    const raw = drafts[item.productId];

    const parsed = raw === "" ? 0 : parseInt(raw, 10);

    if (parsed === item.stock) return;

    saveQuantity(item, parsed);
  }

  function adjustQuantity(item: InventoryProduct, delta: number) {
    const current = item.stock ?? 0;
    const next = Math.max(0, current + delta);

    saveQuantity(item, next);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, InventoryProduct[]>();

    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }

    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [items]);

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
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

        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2">
          Inventory
        </h1>

        <p className="text-black/50 text-sm mb-8">
          Set exact stock counts for any item — it updates live on the website
          and in Pickup. Use the menu for out-of-stock or unlimited items.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-black/40 text-sm">Loading inventory...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center shadow-card">
            <p className="text-black/50">No products found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="font-bold text-black/70 text-sm uppercase tracking-wide mb-3">
                  {category}
                </h2>

                <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                  {categoryItems.map((item, i) => (
                    <div
                      key={item.productId}
                      className={`flex items-center justify-between gap-4 px-6 py-5 flex-wrap ${
                        i !== categoryItems.length - 1
                          ? "border-b border-black/5"
                          : ""
                      }`}
                    >
                      {/* Product information */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.inStock
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {item.inStock ? (
                            <PackageCheck size={18} />
                          ) : (
                            <PackageX size={18} />
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-black text-sm">
                            {item.name}
                          </p>

                          <p className="text-black/40 text-xs">
                            ₹{item.price}
                            {item.stock === null
                              ? " · Unlimited"
                              : item.stock === 0
                              ? " · Out of stock"
                              : ""}
                          </p>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="relative flex items-center gap-2">
                        <button
                          onClick={() => adjustQuantity(item, -1)}
                          disabled={
                            updatingId === item.productId ||
                            item.stock === null ||
                            (item.stock ?? 0) <= 0
                          }
                          className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:bg-black/10 disabled:opacity-30"
                          aria-label={`Decrease stock for ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            item.stock === null
                              ? ""
                              : drafts[item.productId] ?? ""
                          }
                          placeholder={item.stock === null ? "∞" : "0"}
                          onChange={(e) =>
                            handleDraftChange(
                              item.productId,
                              e.target.value
                            )
                          }
                          onBlur={() => handleDraftBlur(item)}
                          disabled={
                            updatingId === item.productId ||
                            item.stock === null
                          }
                          className="w-24 text-center text-sm font-bold border border-black/10 rounded-full py-1.5 focus:outline-none focus:border-[var(--color-magenta)] disabled:bg-black/5 disabled:text-black/30"
                        />

                        <button
                          onClick={() => adjustQuantity(item, 1)}
                          disabled={
                            updatingId === item.productId ||
                            item.stock === null
                          }
                          className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:bg-black/10 disabled:opacity-30"
                          aria-label={`Increase stock for ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>

                        {/* Three-dot menu */}
                        <div className="relative ml-1">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === item.productId
                                  ? null
                                  : item.productId
                              )
                            }
                            disabled={updatingId === item.productId}
                            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:bg-black/10 disabled:opacity-30"
                            aria-label={`More options for ${item.name}`}
                          >
                            <MoreVertical size={17} />
                          </button>

                          {openMenuId === item.productId && (
                            <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-2xl shadow-lg border border-black/5 py-2">
                              {/* Out of stock */}
                              <button
                                onClick={() => saveQuantity(item, 0)}
                                disabled={item.stock === 0}
                                className="w-full text-left px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 disabled:opacity-40"
                              >
                                Mark out of stock
                              </button>

                              {/* Unlimited */}
                              <button
                                onClick={() => saveQuantity(item, null)}
                                disabled={item.stock === null}
                                className="w-full text-left px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 disabled:opacity-40"
                              >
                                Make unlimited
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}