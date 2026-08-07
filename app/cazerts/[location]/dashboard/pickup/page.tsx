"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Printer,
  Wallet,
  Smartphone,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { categories, products, Product } from "@/lib/menu-items";
import { createCounterOrder } from "@/lib/order-store";
import { getTrackedInventory } from "@/lib/inventory";
import { Order, PaymentMethod, CustomerGender, orderTotal } from "@/lib/orders";

type CartLine = { product: Product; qty: number };

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
];

// Prices are GST-inclusive (5% total = 2.5% CGST + 2.5% SGST). This splits
// a tax-inclusive total back into its base amount + the two tax components,
// purely for display on the printed receipt — it doesn't change what the
// customer pays.
function splitGst(totalInclusive: number) {
  const base = totalInclusive / 1.05;
  const totalGst = totalInclusive - base;
  const half = totalGst / 2;
  return {
    base: Math.round(base * 100) / 100,
    cgst: Math.round(half * 100) / 100,
    sgst: Math.round(half * 100) / 100,
  };
}

export default function PickupPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.name ?? "");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerGender, setCustomerGender] = useState<CustomerGender>("male");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [outOfStockNames, setOutOfStockNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Cross-referenced by product name, since this static menu list uses
    // its own local IDs rather than the real Supabase product IDs that
    // the inventory table is keyed on.
    getTrackedInventory()
      .then((items) => {
        const outOfStock = new Set(items.filter((i) => !i.inStock).map((i) => i.name));
        setOutOfStockNames(outOfStock);
      })
      .catch(() => {
        // Non-critical — if this fails, we just won't show stock badges.
      });
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  const cartLines = Object.values(cart);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);

  function addToCart(product: Product) {
    if (outOfStockNames.has(product.name)) return;
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: existing ? existing.qty + 1 : 1 },
      };
    });
  }

  function decrementFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: { ...existing, qty: existing.qty - 1 } };
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function resetOrderForm() {
    setCart({});
    setCustomerName("");
    setCustomerGender("male");
    setPaymentMethod("cash");
    setError("");
  }

  async function handleGenerateBill() {
    if (cartLines.length === 0) {
      setError("Add at least one item before generating the bill.");
      return;
    }
    if (!customerName.trim()) {
      setError("Enter the customer's name.");
      return;
    }
    setError("");

    const items = cartLines.map((line) => ({
      name: line.product.name,
      category: line.product.category,
      qty: line.qty,
      price: line.product.price,
    }));

    const savedOrder = await createCounterOrder(
      locationId,
      customerName.trim(),
      items,
      paymentMethod,
      customerGender
    );
    setLastOrder(savedOrder);
  }

  function handlePrint() {
    window.print();
  }

  function handleNewOrder() {
    setLastOrder(null);
    resetOrderForm();
  }

  const gst = lastOrder ? splitGst(orderTotal(lastOrder)) : null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt {
            position: absolute;
            top: 0;
            left: 0;
            width: 72mm;
          }
          @page {
            size: 72mm auto;
            margin: 0;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12 print:hidden">
        <div className="max-w-6xl mx-auto">
          <Link
            href={`/cazerts/${locationId}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-6"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
            {location ? location.name : "Location"}
          </p>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-8">
            Counter Order
          </h1>

          {lastOrder ? (
            <div className="bg-white rounded-3xl p-10 shadow-card text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} />
              </div>
              <p className="font-display font-extrabold text-xl mb-1">Order taken successfully</p>
              <p className="text-black/50 text-sm mb-6">
                Sent to Live Tracking — you're clear to take the next order.
              </p>

              <div className="bg-black/5 rounded-2xl px-6 py-4 mb-6">
                <p className="text-black/40 text-xs mb-1">Bill Generated</p>
                <p className="font-display font-extrabold text-2xl mb-1">{lastOrder.billNo}</p>
                <p className="text-black/50 text-sm">
                  {lastOrder.customerName} · ₹{orderTotal(lastOrder)}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 bg-black text-white font-semibold px-6 py-3 rounded-full hover:bg-black/80 transition"
                >
                  <Printer size={18} />
                  Print Receipt
                </button>
                <button
                  onClick={handleNewOrder}
                  className="inline-flex items-center gap-2 bg-[var(--color-magenta)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition"
                >
                  Next Order
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Menu */}
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        activeCategory === cat.name
                          ? "bg-black text-white"
                          : "bg-white text-black/60 hover:bg-black/5"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleProducts.map((product) => {
                    const isOutOfStock = outOfStockNames.has(product.name);
                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-2xl p-5 shadow-card flex flex-col relative ${
                          isOutOfStock ? "opacity-60" : ""
                        }`}
                      >
                        {isOutOfStock && (
                          <span className="absolute top-3 right-3 bg-[var(--color-magenta)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                            Out of Stock
                          </span>
                        )}
                        <h3 className="font-bold text-black mb-1">{product.name}</h3>
                        <p className="text-black/50 text-xs mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-extrabold text-[var(--color-magenta)]">
                            ₹{product.price}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[var(--color-magenta)] text-xs font-bold">
                              Unavailable
                            </span>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="inline-flex items-center gap-1 bg-black text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-black/80 transition"
                            >
                              <Plus size={14} />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {visibleProducts.length === 0 && (
                    <p className="text-black/40 text-sm">No items in this category.</p>
                  )}
                </div>
              </div>

              {/* Cart / Bill panel */}
              <div className="bg-white rounded-3xl p-6 shadow-card h-fit sticky top-6">
                <h2 className="font-bold text-black mb-4">Current Order</h2>

                {cartLines.length === 0 ? (
                  <p className="text-black/40 text-sm mb-6">No items added yet.</p>
                ) : (
                  <div className="divide-y divide-black/5 mb-4">
                    {cartLines.map((line) => (
                      <div key={line.product.id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">
                            {line.product.name}
                          </p>
                          <p className="text-xs text-black/40">
                            ₹{line.product.price} × {line.qty}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementFromCart(line.product.id)}
                            className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">
                            {line.qty}
                          </span>
                          <button
                            onClick={() => addToCart(line.product)}
                            className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(line.product.id)}
                            className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 ml-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t border-black/10 mb-4">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-extrabold text-lg text-[var(--color-magenta)]">
                    ₹{cartTotal}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-black/30"
                  />

                  <div className="flex gap-2">
                    {(["male", "female"] as CustomerGender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setCustomerGender(g)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                          customerGender === g
                            ? "bg-black text-white"
                            : "bg-black/5 text-black/50 hover:bg-black/10"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {paymentOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                          paymentMethod === value
                            ? "bg-black text-white"
                            : "bg-black/5 text-black/50 hover:bg-black/10"
                        }`}
                      >
                        <Icon size={13} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                <button
                  onClick={handleGenerateBill}
                  className="w-full bg-[var(--color-magenta)] text-white font-bold py-3.5 rounded-full hover:opacity-90 transition"
                >
                  Generate Bill
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Print-only 72mm receipt */}
      {lastOrder && gst && (
        <div id="receipt" className="hidden print:block font-mono text-black text-[11px] px-3 py-4">
          <div className="text-center mb-2">
            <p className="font-bold text-[16px] tracking-wide">CAZERTS</p>
            <p className="text-[10px]">A unit of RelogFoods</p>
            <p className="text-[10px] mt-0.5">{location?.address ?? location?.name ?? ""}</p>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          <div className="flex justify-between">
            <span>Bill no: {lastOrder.billNo}</span>
          </div>
          <div className="flex justify-between mt-0.5">
            <span>
              Date: {new Date(lastOrder.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span>
              Time: {new Date(lastOrder.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          <div className="flex justify-between font-bold mb-1">
            <span>Items</span>
            <span>Price</span>
          </div>
          {lastOrder.items.map((item, idx) => (
            <div key={idx} className="flex justify-between mb-0.5">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>₹{item.qty * item.price}</span>
            </div>
          ))}

          <div className="border-t border-dashed border-black my-2" />

          <div className="flex justify-between mb-0.5">
            <span>CGST (2.5%)</span>
            <span>₹{gst.cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>SGST (2.5%)</span>
            <span>₹{gst.sgst.toFixed(2)}</span>
          </div>

          <div className="border-t border-black my-1" />

          <div className="flex justify-between font-bold text-[13px]">
            <span>Total</span>
            <span>₹{orderTotal(lastOrder)}</span>
          </div>

          <div className="border-t border-dashed border-black my-3" />

          <div className="text-center">
            <p className="font-semibold">Thank You</p>
            <p>Visit Again</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <InstagramGlyph />
              <span>@cazerts</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}