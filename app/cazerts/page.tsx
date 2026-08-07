"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";

export default function CazertsLocationSelect() {
  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex flex-col items-center justify-center px-5 py-20">
      <div className="text-center mb-14">
        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-3">
          CAZERTS Admin
        </p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl">Which location are you from?</h1>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {LOCATIONS.map((loc, i) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              href={`/cazerts/${loc.id}`}
              className="group flex flex-col items-center justify-center w-52 h-52 md:w-60 md:h-60 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-magenta)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-magenta)] transition-colors">
                <MapPin size={20} className="text-[var(--color-magenta)] group-hover:text-white transition-colors" />
              </div>
              <span className="font-display font-bold text-lg text-center px-4">{loc.name}</span>
              <span className="text-xs text-black/40 mt-1 text-center px-6">{loc.address}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link href="/" className="text-sm text-black/40 hover:text-black mt-14">
        ← Back to store selection
      </Link>
    </main>
  );
}