"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Loader2,
  PackagePlus,
  Boxes,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  getAllInventory,
  addProductStock,
  InventoryProduct,
} from "@/lib/inventory";

type Status = "ok" | "low" | "out" | "unlimited";
type StatusFilter = "all" | "low" | "out";

function statusOf(item: InventoryProduct): Status {
  if (item.stock === null) return "unlimited";
  if (item.stock === 0) return "out";
  if (item.stock <= 5) return "low";
  return "ok";
}

const STATUS_STYLES: Record<
  Status,
  { dot: string; badge: string; hint: string }
> = {
  ok: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
    hint: "",
  },
  low: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600",
    hint: "Running low",
  },
  out: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-500",
    hint: "Out of stock",
  },
  unlimited: {
    dot: "bg-black/25",
    badge: "bg-black/5 text-black/50",
    hint: "Not tracked yet",
  },
};

export default function InventoryPage() {
  const params = useParams();
  const locationId = params.location as string;

  const [items, setItems] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Left card form
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Right card filters
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Row that was just updated (briefly highlighted)
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const qtyRef = useRef<HTMLInputElement>(null);
  const formCardRef = useRef<HTMLElement>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllInventory();
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

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items]
  );

  const productsInCategory = useMemo(
    () => items.filter((i) => i.category === category),
    [items, category]
  );

  const selected = items.find((i) => i.productId === productId) ?? null;

  const counts = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const i of items) {
      const s = statusOf(i);
      if (s === "low") low++;
      if (s === "out") out++;
    }
    return { all: items.length, low, out };
  }, [items]);

  // Right card: apply search + category + status filters, then group
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((i) => {
      if (filterCat !== "All" && i.category !== filterCat) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && statusOf(i) !== statusFilter) return false;
      return true;
    });

    const map = new Map<string, InventoryProduct[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [items, search, filterCat, statusFilter]);

  const visibleCount = visibleGroups.reduce((n, [, list]) => n + list.length, 0);
  const hasFilters =
    search.trim() !== "" || filterCat !== "All" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setFilterCat("All");
    setStatusFilter("all");
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setProductId("");
    setMessage("");
  }

  function handleQtyChange(value: string) {
    // Digits only
    if (value !== "" && !/^\d+$/.test(value)) return;
    setQty(value);
    setMessage("");
  }

  // Tapping a row on the right fills the form on the left
  function pickProduct(item: InventoryProduct) {
    setCategory(item.category);
    setProductId(item.productId);
    setQty("");
    setMessage("");

    // On phones the form is above the list, so bring it into view
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      formCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setTimeout(() => qtyRef.current?.focus(), 80);
  }

  const amount = parseInt(qty, 10);
  const canSave = !!selected && amount > 0 && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !(amount > 0)) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const newStock = await addProductStock(selected.productId, amount);

      // Right card updates straight away with the new total
      setItems((prev) =>
        prev.map((i) =>
          i.productId === selected.productId
            ? { ...i, stock: newStock, inStock: newStock > 0 }
            : i
        )
      );

      setMessage(
        `Added ${amount} to ${selected.name}. Total is now ${newStock}.`
      );

      const savedId = selected.productId;
      setHighlightId(savedId);
      setTimeout(
        () => setHighlightId((cur) => (cur === savedId ? null : cur)),
        2500
      );

      // Keep the category, reset the rest for the next entry
      setProductId("");
      setQty("");
    } catch {
      setError(`Failed to update ${selected.name}. Please try again.`);
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "w-full appearance-none rounded-2xl border border-black/15 bg-white px-4 py-3 pr-11 text-sm font-medium text-black outline-none transition-colors focus:border-[var(--color-magenta)] disabled:bg-black/[0.03] disabled:text-black/30 disabled:cursor-not-allowed";

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All items", count: counts.all },
    { key: "low", label: "Low stock", count: counts.low },
    { key: "out", label: "Out of stock", count: counts.out },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-black/40 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-magenta)]">
          CAZERTS
        </p>

        <h1 className="mb-2 font-display text-3xl font-extrabold md:text-4xl">
          Inventory
        </h1>

        <p className="mb-8 text-sm text-black/50">
          Add stock on the left. The total updates on the right and goes live on
          the website.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-black/40">Loading inventory...</p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-14 text-center shadow-sm">
            <p className="text-black/50">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
            {/* LEFT CARD: add stock */}
            <section
              ref={formCardRef}
              className="scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-7 lg:sticky lg:top-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-magenta)]/10">
                  <PackagePlus
                    size={19}
                    className="text-[var(--color-magenta)]"
                  />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold leading-tight">
                    Add stock
                  </h2>
                  <p className="text-xs text-black/40">
                    Choose an item and enter the quantity
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Category */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-black/50">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/40"
                    />
                  </div>
                </div>

                {/* Product */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-black/50">
                    Product name
                  </label>
                  <div className="relative">
                    <select
                      value={productId}
                      onChange={(e) => {
                        setProductId(e.target.value);
                        setMessage("");
                      }}
                      disabled={!category}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        {category ? "Select product" : "Choose a category first"}
                      </option>
                      {productsInCategory.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/40"
                    />
                  </div>
                  {selected && (
                    <p className="mt-2 text-xs text-black/40">
                      Currently{" "}
                      {selected.stock === null
                        ? "unlimited (saving will start tracking stock)"
                        : `${selected.stock} in stock`}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-black/50">
                    Quantity to add
                  </label>
                  <input
                    ref={qtyRef}
                    type="text"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    placeholder="e.g. 10"
                    disabled={!selected}
                    className="w-full rounded-2xl border border-black/15 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[var(--color-magenta)] disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-black/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSave}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-magenta)] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving..." : "Save"}
                </button>

                {message && (
                  <div className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
                    <Check size={15} className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}
              </form>
            </section>

            {/* RIGHT CARD: totals */}
            <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              {/* Header */}
              <div className="border-b border-black/10 px-6 py-5 md:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
                    <Boxes size={19} className="text-black/60" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-extrabold leading-tight">
                      Stock available
                    </h2>
                    <p className="text-xs text-black/40">
                      Tap any item to add stock to it
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mt-5">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products"
                    className="w-full rounded-2xl border border-black/15 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-[var(--color-magenta)]"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status tabs */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {statusTabs.map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                          active
                            ? "bg-black text-white"
                            : "bg-black/5 text-black/60 hover:bg-black/10"
                        }`}
                      >
                        {tab.label}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            active ? "bg-white/20" : "bg-white"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Category chips */}
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {["All", ...categories].map((c) => {
                    const active = filterCat === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFilterCat(c)}
                        className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-[var(--color-magenta)] bg-[var(--color-magenta)]/10 text-[var(--color-magenta)]"
                            : "border-black/10 text-black/50 hover:border-black/25 hover:text-black"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[560px] overflow-y-auto [scrollbar-color:rgba(0,0,0,0.18)_transparent] [scrollbar-width:thin]">
                {visibleCount === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm font-semibold text-black/60">
                      No products match
                    </p>
                    <p className="mt-1 text-xs text-black/40">
                      Try a different search or filter.
                    </p>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 rounded-full bg-black/5 px-5 py-2 text-xs font-bold text-black/60 hover:bg-black/10"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  visibleGroups.map(([cat, catItems]) => (
                    <div key={cat}>
                      <p className="sticky top-0 z-10 border-b border-black/5 bg-white/95 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-black/35 backdrop-blur md:px-7">
                        {cat}
                      </p>

                      {catItems.map((item) => {
                        const status = statusOf(item);
                        const style = STATUS_STYLES[status];
                        const isPicked = productId === item.productId;

                        return (
                          <button
                            key={item.productId}
                            type="button"
                            onClick={() => pickProduct(item)}
                            className={`group flex w-full items-center justify-between gap-4 border-b border-black/5 px-6 py-3.5 text-left transition-colors duration-500 last:border-b-0 hover:bg-black/[0.03] md:px-7 ${
                              highlightId === item.productId
                                ? "bg-green-50"
                                : isPicked
                                ? "bg-[var(--color-magenta)]/5"
                                : ""
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-black">
                                  {item.name}
                                </p>
                                {style.hint && (
                                  <p className="text-xs text-black/40">
                                    {style.hint}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span
                                className={`min-w-[3rem] rounded-full px-3.5 py-1.5 text-center text-sm font-extrabold ${style.badge}`}
                              >
                                {item.stock === null ? "∞" : item.stock}
                              </span>
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-black/40 transition-colors group-hover:bg-[var(--color-magenta)] group-hover:text-white">
                                <Plus size={14} />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-black/10 bg-black/[0.02] px-6 py-3 text-xs text-black/40 md:px-7">
                Showing {visibleCount} of {items.length} products
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}