"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  ShoppingBag,
  TrendingUp,
  Trophy,
  ImageIcon,
  MessageSquare,
  PackageX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { getOrders } from "@/lib/order-store";
import { getTodaysRevenue, getLeaderboard } from "@/lib/orders";

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
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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
        id: "products",
        title: "Products",
        subtitle: "Manage photos",
        href: `/cazerts/${locationId}/dashboard/products`,
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

  const totalPages = pages.length;
  const currentCards = pages[pageIndex];

  function goTo(next: number) {
    if (next < 0 || next >= totalPages) return;
    setDirection(next > pageIndex ? 1 : -1);
    setPageIndex(next);
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex flex-col items-center justify-center px-5 py-20">
      <Link href="/cazerts" className="text-sm text-black/40 hover:text-black mb-10">
        ← Switch location
      </Link>

      <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2 text-center">
        CAZERTS Admin
      </p>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-10 text-center">
        {location ? location.name : "Dashboard"}
      </h1>

      <div className="flex items-center gap-4 md:gap-8 w-full justify-center">
        <button
          onClick={() => goTo(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label="Previous page"
          className="w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-black/60 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={pageIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
            >
              {currentCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => goTo(pageIndex + 1)}
          disabled={pageIndex === totalPages - 1}
          aria-label="Next page"
          className="w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-black/60 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-10">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to page ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === pageIndex ? "w-6 bg-[var(--color-magenta)]" : "w-2 bg-black/15"
            }`}
          />
        ))}
      </div>
    </main>
  );
}