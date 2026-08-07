"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const BRANDS = [
  {
    id: "cazerts",
    name: "CAZERTS",
    href: "/cazerts",
    bg: "bg-[var(--color-magenta)]",
    text: "text-white",
  },
  {
    id: "snacks",
    name: "SNACKS",
    href: "/snacks",
    bg: "bg-black",
    text: "text-[var(--color-gold)]",
  },
];

export default function AdminHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cream)] px-5 py-20">
      <div className="text-center mb-14">
        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-3">
          Admin Panel
        </p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl">Which store are you managing?</h1>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
        {BRANDS.map((brand, i) => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              href={brand.href}
              className={`group relative flex flex-col items-center justify-center w-56 h-56 md:w-64 md:h-64 rounded-full ${brand.bg} ${brand.text} shadow-xl hover:scale-105 transition-transform duration-300`}
            >
              <span className="font-display font-extrabold text-2xl md:text-3xl tracking-tight">
                {brand.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}