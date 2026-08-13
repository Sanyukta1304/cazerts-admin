"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radio,
  ShoppingBag,
  TrendingUp,
  Trophy,
  ImageIcon,
  MessageSquare,
  PackageX,
  Power,
} from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { getOrders } from "@/lib/order-store";
import { getTodaysRevenue, getLeaderboard } from "@/lib/orders";
import { getStoreStatus, setManualClosed, setManualOpen } from "@/lib/store-status";

type CardDef = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  bg: string;
  count: number;
  isStat?: boolean;
};

export default function DashboardHub() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [pendingDelivery, setPendingDelivery] = useState(0);
  const [pendingPickup, setPendingPickup] = useState(0);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [topItem, setTopItem] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState<boolean | null>(null);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    refreshStoreStatus();
  }, [locationId]);

  async function refreshStoreStatus() {
    try {
      const s = await getStoreStatus(locationId);
      setStoreOpen(s.isOpen);
    } catch {
      setStoreOpen(null);
    }
  }

  useEffect(() => {
    async function loadStats() {
      const orders = await getOrders(locationId);
      setPendingDelivery(orders.filter((o) => o.status === "pending" && o.mode !== "pickup").length);
      setPendingPickup(orders.filter((o) => o.status === "pending" && o.mode === "pickup").length);
      setTodaysRevenue(getTodaysRevenue(orders));

      const leaderboard = getLeaderboard(orders);
      setTopItem(leaderboard.length > 0 ? leaderboard[0].name : null);
    }
    loadStats();
  }, [locationId]);

  async function handleToggleStore() {
    if (storeOpen === null || togglingStore) return;
    setTogglingStore(true);
    try {
      if (storeOpen) {
        // currently open -> close it for the rest of today
        await setManualClosed(locationId, true);
      } else {
        // currently closed -> force it open for the rest of today
        await setManualOpen(locationId, true);
      }
      await refreshStoreStatus();
    } catch (err) {
      console.error("Error toggling store status:", err);
    } finally {
      setTogglingStore(false);
    }
  }

  const pages: CardDef[][] = [
    [
      {
        id: "live-tracking",
        title: "Live Tracking",
        subtitle: "Dine-in & delivery orders",
        href: `/cazerts/${locationId}/dashboard/live-tracking`,
        icon: Radio,
        bg: "bg-[var(--color-magenta)]",
        count: pendingDelivery + pendingPickup,
      },
      {
        id: "pickup",
        title: "Pickup",
        subtitle: "Walk-in counter orders",
        href: `/cazerts/${locationId}/dashboard/pickup`,
        icon: ShoppingBag,
        bg: "bg-black",
        count: 0,
        isStat: true,
      },
    ],
    [
      {
        id: "sales",
        title: "Today's Sales",
        subtitle: `₹${todaysRevenue.toLocaleString("en-IN")} so far`,
        href: `/cazerts/${locationId}/dashboard/sales`,
        icon: TrendingUp,
        bg: "bg-[var(--color-gold)]",
        count: 0,
        isStat: true,
      },
      {
        id: "leaderboard",
        title: "Leaderboard",
        subtitle: topItem ? `Top: ${topItem}` : "No sales yet",
        href: `/cazerts/${locationId}/dashboard/leaderboard`,
        icon: Trophy,
        bg: "bg-emerald-600",
        count: 0,
        isStat: true,
      },
    ],
    [
      {
        id: "photos",
        title: "Photos",
        subtitle: "Manage photos",
        href: `/cazerts/${locationId}/dashboard/photos`,
        icon: ImageIcon,
        bg: "bg-indigo-600",
        count: 0,
        isStat: true,
      },
      {
        id: "feedback",
        title: "Feedback",
        subtitle: "Reviews & newsletter",
        href: `/cazerts/${locationId}/dashboard/feedback`,
        icon: MessageSquare,
        bg: "bg-rose-600",
        count: 0,
        isStat: true,
      },
      {
        id: "inventory",
        title: "Inventory",
        subtitle: "Cake can stock",
        href: `/cazerts/${locationId}/dashboard/inventory`,
        icon: PackageX,
        bg: "bg-orange-600",
        count: 0,
        isStat: true,
      },
    ],
  ];

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      <div className="max-w-5xl mx-auto px-5">
        <div className="pt-10 pb-2">
          <Link href="/cazerts" className="text-sm text-black/40 hover:text-black">
            ← Switch location
          </Link>
        </div>
      </div>

      {/* Each group of cards is its own full-screen section, like the
          Hero/Categories/Collections sections on the main site — scroll
          down normally and the next set of cards fills the screen. */}
      {pages.map((cards, pageIdx) => (
        <section
          key={pageIdx}
          className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
        >
          {pageIdx === 0 && (
            <>
              <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2 text-center">
                CAZERTS Admin
              </p>
              <div className="flex items-center justify-center gap-3 mb-10">
                <h1 className="font-display font-extrabold text-3xl md:text-4xl text-center">
                  {location ? location.name : "Dashboard"}
                </h1>
                <button
                  onClick={handleToggleStore}
                  disabled={storeOpen === null || togglingStore}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-card transition disabled:opacity-50 ${
                    storeOpen ? "bg-green-600 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  <Power size={14} />
                  {storeOpen === null
                    ? "Checking..."
                    : storeOpen
                    ? "Open now"
                    : "Closed now"}
                </button>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  href={card.href}
                  className={`group relative flex flex-col items-center justify-center w-56 h-56 md:w-64 md:h-64 rounded-3xl ${card.bg} text-white shadow-xl hover:scale-105 transition-transform duration-300 px-4 text-center`}
                >
                  {!card.isStat && card.count > 0 && (
                    <span className="absolute top-4 right-4 min-w-[28px] h-7 px-2 rounded-full bg-[var(--color-gold)] text-black text-xs font-extrabold flex items-center justify-center">
                      {card.count}
                    </span>
                  )}
                  <card.icon size={30} className="mb-4" />
                  <span className="font-display font-extrabold text-xl">{card.title}</span>
                  <span className="text-xs text-white/70 mt-1">{card.subtitle}</span>
                  {!card.isStat && card.count > 0 && (
                    <span className="text-[11px] font-semibold text-[var(--color-gold)] mt-3">
                      {card.count} pending
                    </span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {pageIdx < pages.length - 1 && (
            <p className="text-[11px] text-black/30 mt-14 tracking-wide uppercase animate-bounce">
              Scroll for more ↓
            </p>
          )}
        </section>
      ))}
    </main>
  );
}