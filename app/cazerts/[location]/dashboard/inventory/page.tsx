"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageX, PackageCheck } from "lucide-react";
import { getTrackedInventory, setProductStock, InventoryProduct } from "@/lib/inventory";

export default function InventoryPage() {
  const params = useParams();
  const locationId = params.location as string;

  const [items, setItems] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getTrackedInventory();
      setItems(data);
    } catch {
      setError("Couldn't load inventory. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(item: InventoryProduct) {
    setUpdatingId(item.productId);
    setError("");
    const nextInStock = !item.inStock;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.productId === item.productId ? { ...i, inStock: nextInStock } : i))
    );

    try {
      await setProductStock(item.productId, nextInStock);
    } catch {
      setError(`Failed to update ${item.name}. Please try again.`);
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

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
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2">Cake Can Inventory</h1>
        <p className="text-black/50 text-sm mb-8">
          Mark items out of stock when you run out — it shows immediately on the website.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {loading ? (
          <p className="text-black/40 text-sm">Loading inventory...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center shadow-card">
            <p className="text-black/50">No Cake Can products found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {items.map((item, i) => (
              <div
                key={item.productId}
                className={`flex items-center justify-between px-6 py-5 ${
                  i !== items.length - 1 ? "border-b border-black/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.inStock ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {item.inStock ? <PackageCheck size={18} /> : <PackageX size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">{item.name}</p>
                    <p className="text-black/40 text-xs">₹{item.price}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(item)}
                  disabled={updatingId === item.productId}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition disabled:opacity-50 ${
                    item.inStock
                      ? "bg-black/5 text-black/60 hover:bg-red-50 hover:text-red-500"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {updatingId === item.productId
                    ? "Updating..."
                    : item.inStock
                    ? "Mark Out of Stock"
                    : "Mark In Stock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}