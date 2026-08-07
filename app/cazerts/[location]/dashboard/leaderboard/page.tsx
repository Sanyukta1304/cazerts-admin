"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Sparkles, Star } from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { getOrders } from "@/lib/order-store";
import {
  getThisMonthsOrders,
  getCrownLeaderboard,
  CrownLeaderboardEntry,
} from "@/lib/orders";

const AVATAR_BG = [
  "#f5c451",
  "#7dd3c0",
  "#f4978e",
  "#a3c9f9",
  "#c8b6ff",
  "#ffd6a5",
];

const RANK_STYLES = [
  { badge: "bg-yellow-400 text-black", ring: "ring-4 ring-yellow-300" },
  { badge: "bg-gray-300 text-black", ring: "ring-4 ring-gray-200" },
  { badge: "bg-amber-600 text-white", ring: "ring-4 ring-amber-400" },
];

type FloatingIcon = {
  id: number;
  Icon: typeof Crown;
  left: string;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

function AnimatedBackground() {
  const icons = useMemo<FloatingIcon[]>(() => {
    const pool = [Crown, Sparkles, Star];
    const colors = ["#ec4899", "#f5c451", "#a855f7", "#22d3ee"];

    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      Icon: pool[i % pool.length],
      left: `${(i * 137.5) % 100}%`,
      size: 18 + ((i * 7) % 24),
      duration: 14 + ((i * 3) % 10),
      delay: (i % 7) * 1.3,
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, var(--color-magenta), transparent 70%)",
        }}
        animate={{ x: [-100, 100, -100], y: [-50, 80, -50] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute right-0 w-[450px] h-[450px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, #f5c451, transparent 70%)",
        }}
        animate={{ x: [80, -80, 80], y: [60, -60, 60] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {icons.map(({ id, Icon, left, size, duration, delay, color }) => (
        <motion.div
          key={id}
          className="absolute"
          style={{ left, bottom: -40 }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -900, opacity: [0, 0.4, 0.4, 0] }}
          transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
        >
          <Icon size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}

function EntryAvatar({ entry, color }: { entry: CrownLeaderboardEntry; color: string }) {
  if (entry.avatarId) {
    return (
      <img
        src={`/avatars/${entry.avatarId}.jpg`}
        alt={entry.name}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-extrabold text-2xl text-white"
      style={{ backgroundColor: color }}
    >
      {entry.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [leaderboard, setLeaderboard] = useState<CrownLeaderboardEntry[]>([]);

  useEffect(() => {
    async function load() {
      const orders = await getOrders(locationId);
      const thisMonth = getThisMonthsOrders(orders);
      setLeaderboard(getCrownLeaderboard(thisMonth));
    }

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [locationId]);

  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] px-5 py-14 md:px-12 text-black overflow-hidden">
      <AnimatedBackground />

      <div className="relative max-w-4xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-10"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="text-center mb-14">
          <p className="text-black/40 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            {location ? location.name : "Location"} ·{" "}
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>

          <h1 className="font-extrabold text-5xl md:text-7xl tracking-tight text-[var(--color-magenta)] uppercase italic">
            Cazerts Paglu
          </h1>

          <p className="text-black/50 text-sm mt-3 tracking-wide">
            Top crown earners this month
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center shadow-card">
            <p className="text-black/50">
              No crowns earned yet this month — first order takes the throne 👑
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, i) => {
              const rankStyle = RANK_STYLES[i] ?? { badge: "bg-black/5 text-black/50", ring: "" };
              const color = AVATAR_BG[i % AVATAR_BG.length];

              return (
                <motion.div
                  key={entry.name}
                  initial={
                    i === 0
                      ? { opacity: 0, scale: 0.65, y: 50 }
                      : { opacity: 0, x: -25 }
                  }
                  animate={
                    i === 0
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 1, x: 0 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 180,
                    damping: 16,
                    delay: i * 0.08,
                  }}
                  className={`relative flex items-center gap-5 rounded-3xl px-6 py-5 shadow-card overflow-visible ${
                    i === 0
                      ? "bg-gradient-to-r from-[var(--color-gold)]/20 via-[var(--color-magenta)]/10 to-[var(--color-gold)]/20 border-2 border-[var(--color-gold)]/40"
                      : "bg-white"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg ${rankStyle.badge}`}
                  >
                    {i + 1}
                  </div>

                  <div
                    className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden ${rankStyle.ring}`}
                  >
                    <EntryAvatar entry={entry} color={color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate flex items-center gap-2 text-black">
                      {entry.name}

                      {i === 0 && (
                        <motion.span
                          animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          👑
                        </motion.span>
                      )}
                    </p>

                    <p className="text-black/50 text-sm">
                      ₹{entry.totalSpent.toLocaleString("en-IN")} spent this month
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2 bg-black px-4 py-2 rounded-full">
                    {i === 0 ? (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0], y: [0, -6, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Crown size={20} className="text-[var(--color-gold)]" />
                      </motion.div>
                    ) : (
                      <Crown size={18} className="text-[var(--color-gold)]" />
                    )}

                    <span className="font-extrabold text-lg text-white">
                      {entry.crowns}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}