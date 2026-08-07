"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Bell, Car, UtensilsCrossed, PackageCheck, ChefHat, Clock, X } from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { Order, OrderStatus, orderTotal, nextStatus } from "@/lib/orders";
import { getOrders, updateOrderStatus } from "@/lib/order-store";
import { playNotificationSound } from "@/lib/notify";

const MODE_CONFIG = {
  pickup: { label: "Pickup", icon: PackageCheck, color: "bg-blue-50 text-blue-600" },
  dinein: { label: "Dine-in", icon: UtensilsCrossed, color: "bg-amber-50 text-amber-600" },
  delivery: { label: "Delivery", icon: Car, color: "bg-purple-50 text-purple-600" },
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock; actionLabel: string | null }> = {
  pending: { label: "Pending", color: "bg-black/5 text-black/60", icon: Clock, actionLabel: "Start processing" },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-600", icon: ChefHat, actionLabel: "Mark ready" },
  ready: { label: "Ready", color: "bg-blue-50 text-blue-600", icon: Bell, actionLabel: "Complete order" },
  completed: { label: "Completed", color: "bg-green-50 text-green-600", icon: Check, actionLabel: null },
};

const POP_SPRING = { type: "spring", stiffness: 500, damping: 32, mass: 0.6 } as const;

// How often to poll Supabase for new orders while this page is open.
const POLL_INTERVAL_MS = 8000;

export default function LiveTrackingPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showNewOrderPopup(order: Order) {
    if (popupTimer.current) clearTimeout(popupTimer.current);
    setNewOrderPopup(order);
    popupTimer.current = setTimeout(() => setNewOrderPopup(null), 5000);
  }

  async function refresh(playSoundForNew: boolean) {
    const latest = await getOrders(locationId);
    const brandNew = playSoundForNew
      ? latest.find((o) => !knownIds.current.has(o.id))
      : undefined;
    knownIds.current = new Set(latest.map((o) => o.id));
    setOrders(latest);
    if (brandNew) {
      playNotificationSound();
      showNewOrderPopup(brandNew);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const initial = await getOrders(locationId);
      if (cancelled) return;
      knownIds.current = new Set(initial.map((o) => o.id));
      setOrders(initial);
    }
    loadInitial();

    // Poll for new orders from the live website (or other admin tabs/devices)
    // instead of relying on the browser "storage" event, which only fires
    // for localStorage — not for Supabase changes.
    const interval = setInterval(() => {
      refresh(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [locationId]);

  async function handleAdvance(order: Order) {
    const next = nextStatus(order.status);
    if (!next) return;
    await updateOrderStatus(order.id, next);
    await refresh(false);
    setConfirmMsg(
      next === "completed" ? "Order marked as completed!" : `Order moved to ${STATUS_CONFIG[next].label.toLowerCase()}!`
    );
    setTimeout(() => setConfirmMsg(""), 2000);
  }

  const active = orders
    .filter((o) => o.status !== "completed")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const completed = orders
    .filter((o) => o.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="text-sm text-black/40 hover:text-black mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>

        <div className="mb-10">
          <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            {location ? location.name : ""} · Live Tracking
          </p>
          <h1 className="font-display font-extrabold text-3xl">All Orders</h1>
        </div>

        <h2 className="font-display font-bold text-lg mb-4">Active ({active.length})</h2>
        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden mb-12">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-black/40 uppercase tracking-wide">
                <th className="font-semibold px-5 py-3">Customer</th>
                <th className="font-semibold px-5 py-3">Items</th>
                <th className="font-semibold px-5 py-3">Mode</th>
                <th className="font-semibold px-5 py-3">Total</th>
                <th className="font-semibold px-5 py-3">Status</th>
                <th className="font-semibold px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {active.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-black/40 text-sm py-6 px-5">
                      No active orders right now.
                    </td>
                  </tr>
                ) : (
                  active.map((order) => {
                    const ModeIcon = MODE_CONFIG[order.mode].icon;
                    const statusInfo = STATUS_CONFIG[order.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={POP_SPRING}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="px-5 py-4 align-middle">
                          <span className="font-display font-bold">{order.customerName}</span>{" "}
                          <span className="text-xs text-black/30">#{order.billNo}</span>
                        </td>
                        <td className="px-5 py-4 align-middle text-black/50 max-w-xs">
                          {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${MODE_CONFIG[order.mode].color}`}
                          >
                            <ModeIcon size={13} /> {MODE_CONFIG[order.mode].label}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle font-display font-extrabold whitespace-nowrap">
                          ₹{orderTotal(order)}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <motion.span
                            key={order.status}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.18 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${statusInfo.color}`}
                          >
                            <StatusIcon size={13} /> {statusInfo.label}
                          </motion.span>
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleAdvance(order)}
                            className="px-4 py-2 rounded-full border-2 border-black/10 text-xs font-bold hover:border-[var(--color-magenta)] hover:bg-[var(--color-magenta)] hover:text-white transition-colors whitespace-nowrap"
                          >
                            {statusInfo.actionLabel}
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <PackageCheck size={18} className="text-green-600" /> Completed ({completed.length})
        </h2>
        <div className="bg-white/60 rounded-3xl border border-black/5 overflow-hidden opacity-60 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-black/40 uppercase tracking-wide">
                <th className="font-semibold px-5 py-3">Bill no</th>
                <th className="font-semibold px-5 py-3">Customer</th>
                <th className="font-semibold px-5 py-3">Items</th>
                <th className="font-semibold px-5 py-3">Category</th>
                <th className="font-semibold px-5 py-3">Qty</th>
                <th className="font-semibold px-5 py-3">Mode</th>
                <th className="font-semibold px-5 py-3">Payment</th>
                <th className="font-semibold px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((order) => {
                const ModeIcon = MODE_CONFIG[order.mode].icon;
                const time = new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={order.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-4 align-top font-display font-bold whitespace-nowrap">
                      {order.billNo}
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap">{order.customerName}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        {order.items.map((i, idx) => (
                          <span key={idx} className="text-black/70 whitespace-nowrap">
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        {order.items.map((i, idx) => (
                          <span key={idx} className="text-black/50 whitespace-nowrap">
                            {i.category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        {order.items.map((i, idx) => (
                          <span key={idx} className="text-black/50">
                            {i.qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${MODE_CONFIG[order.mode].color}`}
                      >
                        <ModeIcon size={13} /> {MODE_CONFIG[order.mode].label}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap uppercase text-xs font-bold text-black/50">
                      {order.paymentMethod}
                    </td>
                    <td className="px-5 py-4 align-top text-right whitespace-nowrap text-black/50">
                      {time}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {newOrderPopup && (
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
            transition={POP_SPRING}
            className="fixed top-6 right-6 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-black/5 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.6, repeat: 1 }}
                  className="w-8 h-8 rounded-full bg-[var(--color-magenta)] text-white flex items-center justify-center"
                >
                  <Bell size={15} />
                </motion.span>
                <span className="font-display font-extrabold text-sm">New order in</span>
              </div>
              <button
                onClick={() => setNewOrderPopup(null)}
                className="text-black/30 hover:text-black transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold">{newOrderPopup.customerName}</span>
              <span className="text-xs text-black/30">#{newOrderPopup.billNo}</span>
            </div>
            <p className="text-sm text-black/50 mb-3">
              {newOrderPopup.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
            </p>

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${MODE_CONFIG[newOrderPopup.mode].color}`}
              >
                {MODE_CONFIG[newOrderPopup.mode].label}
              </span>
              <span className="font-display font-extrabold text-lg">
                ₹{orderTotal(newOrderPopup)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={POP_SPRING}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3.5 rounded-full font-semibold text-sm shadow-xl flex items-center gap-2"
          >
            <Check size={16} className="text-green-400" /> {confirmMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}