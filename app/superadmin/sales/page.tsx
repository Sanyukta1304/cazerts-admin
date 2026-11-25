"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  Check,
  Crown,
  Loader2,
  MapPin,
  Receipt,
  RefreshCw,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CustomRange,
  getSalesSummary,
  Period,
  PERIODS,
  SalesSummary,
  shiftDate,
  todayIST,
} from "@/lib/superadminSales";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// shows a discount as "- ₹x" (or ₹0 when there is none)
function neg(n: number) {
  return n > 0 ? `- ${inr.format(n)}` : inr.format(0);
}

// one colour per store, used in the split bar + legend (tuned for the magenta card)
const STORE_COLORS = ["#ffffff", "#FFC2E0", "#5B0A33"];

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRange(r: CustomRange) {
  return r.from === r.to ? fmtDate(r.from) : `${fmtDate(r.from)} – ${fmtDate(r.to)}`;
}

export default function SuperAdminSalesPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [applied, setApplied] = useState<CustomRange | null>(null);
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // custom date panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  async function load(p: Period, range: CustomRange | null) {
    setLoading(true);
    setError("");
    try {
      const summary = await getSalesSummary(p, range);
      setData(summary);
      setUpdatedAt(new Date());
    } catch {
      setError("Couldn't load sales. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (period === "custom" && !applied) return;
    load(period, applied);
  }, [period, applied]);

  const today = todayIST();

  function toggleCustomPanel() {
    if (!panelOpen && (!draftFrom || !draftTo)) {
      setDraftFrom(applied?.from ?? shiftDate(today, -6));
      setDraftTo(applied?.to ?? today);
    }
    setPanelOpen((o) => !o);
  }

  function pickPeriod(p: Period) {
    setPanelOpen(false);
    setPeriod(p);
  }

  function applyRange(from: string, to: string) {
    setDraftFrom(from);
    setDraftTo(to);
    setApplied({ from, to });
    setPeriod("custom");
    setPanelOpen(false);
  }

  const rangeError =
    !draftFrom || !draftTo
      ? "Pick both dates."
      : draftFrom > draftTo
      ? "'To' can't be before 'From'."
      : draftTo > today || draftFrom > today
      ? "Future dates aren't allowed."
      : "";

  const presets = [
    { label: "Yesterday", from: shiftDate(today, -1), to: shiftDate(today, -1) },
    { label: "Last 7 days", from: shiftDate(today, -6), to: today },
    { label: "Last 30 days", from: shiftDate(today, -29), to: today },
  ];

  const periodLabel =
    period === "custom"
      ? applied
        ? fmtRange(applied)
        : ""
      : PERIODS.find((p) => p.key === period)?.label ?? "";

  const emptyText =
    period === "custom"
      ? "No sales in this range"
      : periodLabel === "All time"
      ? "No sales recorded yet"
      : `No sales yet ${periodLabel.toLowerCase()}`;

  const hasSales = !!data && data.overall.orders > 0;
  const totalRevenue = data?.overall.revenue ?? 0;

  return (
    <main className="px-5 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Heading + refresh */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
              CAZERTS Super Admin
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Sales
            </h1>
            <p className="mt-2 max-w-xl text-sm text-black/45 md:text-base">
              Overall sales across all three stores, and each store on its own.
            </p>
          </div>

          <button
            type="button"
            onClick={() => load(period, applied)}
            disabled={loading || (period === "custom" && !applied)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black/60 shadow-sm transition hover:-translate-y-0.5 hover:text-black hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Refresh
          </button>
        </div>

        {/* Period tabs */}
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-black/5 bg-white p-1.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => pickPeriod(p.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  period === p.key
                    ? "bg-[var(--color-magenta)] text-white shadow-md shadow-[var(--color-magenta)]/30"
                    : "text-black/55 hover:bg-black/5 hover:text-black"
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              type="button"
              onClick={toggleCustomPanel}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                period === "custom"
                  ? "bg-[var(--color-magenta)] text-white shadow-md shadow-[var(--color-magenta)]/30"
                  : panelOpen
                  ? "bg-black/5 text-black"
                  : "text-black/55 hover:bg-black/5 hover:text-black"
              }`}
            >
              <CalendarRange size={15} />
              Custom
            </button>
          </div>

          {updatedAt && !error && periodLabel && (
            <p className="flex items-center gap-2 text-xs text-black/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {periodLabel} · updated{" "}
              {updatedAt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Custom date panel */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              key="custom-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-magenta)]/10">
                      <CalendarRange
                        size={17}
                        className="text-[var(--color-magenta)]"
                      />
                    </div>
                    <div>
                      <p className="font-display text-base font-extrabold leading-tight">
                        Custom date range
                      </p>
                      <p className="text-xs text-black/40">
                        Both days are included.
                      </p>
                    </div>
                  </div>

                  {/* quick presets */}
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyRange(p.from, p.to)}
                        className="rounded-full border border-black/10 bg-[var(--color-cream)] px-3.5 py-1.5 text-xs font-semibold text-black/60 transition hover:border-[var(--color-magenta)]/40 hover:text-[var(--color-magenta)]"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                      From
                    </span>
                    <input
                      type="date"
                      value={draftFrom}
                      max={today}
                      onChange={(e) => setDraftFrom(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-black/10 bg-[var(--color-cream)] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                      To
                    </span>
                    <input
                      type="date"
                      value={draftTo}
                      min={draftFrom || undefined}
                      max={today}
                      onChange={(e) => setDraftTo(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-black/10 bg-[var(--color-cream)] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => applyRange(draftFrom, draftTo)}
                    disabled={!!rangeError}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-magenta)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--color-magenta)]/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    <Check size={16} />
                    Apply
                  </button>
                </div>

                {rangeError && (
                  <p className="mt-3 text-xs font-medium text-red-500">
                    {rangeError}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* First load placeholder */}
        {!data && !error && (
          <div className="mt-8 space-y-6">
            <div className="h-72 animate-pulse rounded-[2rem] bg-[var(--color-magenta)]/15" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-3xl bg-black/5"
                />
              ))}
            </div>
          </div>
        )}

        {data && (
          <div
            className={`mt-8 space-y-6 transition-opacity ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
                        {/* CARD 1: all stores combined */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-magenta)] via-[var(--color-magenta)] to-[#8E0A4E] p-6 text-white shadow-xl shadow-[var(--color-magenta)]/25 md:p-9"
            >
              {/* soft light blobs + dot texture */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#FFB3D9]/25 blur-3xl" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
                    <TrendingUp size={21} />
                  </div>
                  <div>
                    <p className="font-display text-lg font-extrabold leading-tight">
                      All stores combined
                    </p>
                    <p className="text-xs text-white/70">
                      BTM Layout + Indiranagar + Koramangala
                    </p>
                  </div>
                </div>

                {/* TOTAL / DISCOUNT / NET: full width */}
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                  <div className="rounded-2xl bg-white/15 px-5 py-5 ring-1 ring-white/25 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      Total revenue
                    </p>
                    <p className="mt-2 whitespace-nowrap font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                      {inr.format(data.overall.gross)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-5 py-5 ring-1 ring-white/25 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      Discount
                    </p>
                    <p className="mt-2 whitespace-nowrap font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                      {neg(data.overall.discount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-5 py-5 text-[var(--color-magenta)] shadow-lg">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-magenta)]/70">
                      Net revenue
                    </p>
                    <p className="mt-2 whitespace-nowrap font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                      {inr.format(data.overall.revenue)}
                    </p>
                  </div>
                </div>

                {!hasSales && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-medium text-white ring-1 ring-white/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {emptyText}
                  </p>
                )}

                {/* Stats + store split */}
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {/* LEFT: orders, avg, top store */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/25 backdrop-blur-sm">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        <Receipt size={12} />
                        Orders
                      </p>
                      <p className="mt-1.5 text-2xl font-extrabold">
                        {data.overall.orders}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/25 backdrop-blur-sm">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        <Wallet size={12} />
                        Avg order
                      </p>
                      <p className="mt-1.5 whitespace-nowrap text-2xl font-extrabold">
                        {inr.format(data.overall.average)}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/25 backdrop-blur-sm">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        <Crown size={12} />
                        Top store
                      </p>
                      <p
                        className={`mt-1.5 font-extrabold ${
                          data.bestStore ? "text-2xl" : "text-base text-white/60"
                        }`}
                      >
                        {data.bestStore ?? "No data yet"}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT: net revenue split by store */}
                  <div className="flex flex-col justify-center rounded-2xl bg-white/15 p-5 ring-1 ring-white/25 backdrop-blur-sm md:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Net revenue split by store
                    </p>

                    {/* stacked bar */}
                    <div className="mt-4 flex h-3 w-full gap-1 overflow-hidden rounded-full">
                      {hasSales && totalRevenue > 0 ? (
                        data.stores.map((s, i) => (
                          <motion.div
                            key={s.locationId}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.share}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                            style={{ background: STORE_COLORS[i % 3] }}
                            className="h-3 rounded-full"
                          />
                        ))
                      ) : (
                        <div className="h-3 w-full rounded-full border border-dashed border-white/40 bg-white/10" />
                      )}
                    </div>

                    {/* legend */}
                    <div className="mt-5 space-y-3">
                      {data.stores.map((s, i) => (
                        <div
                          key={s.locationId}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/40"
                              style={{ background: STORE_COLORS[i % 3] }}
                            />
                            <span className="truncate text-white/90">{s.name}</span>
                          </span>
                          <span className="flex items-baseline gap-2">
                            <span className="whitespace-nowrap font-bold">
                              {inr.format(s.revenue)}
                            </span>
                            <span className="w-10 text-right text-xs text-white/65">
                              {s.share}%
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* REVENUE TABLE: total, discount, net */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
            >
              <div className="px-6 pb-3 pt-6">
                <p className="font-display text-lg font-extrabold">
                  Revenue breakdown
                </p>
                <p className="text-xs text-black/40">
                  Net revenue = total revenue minus discounts.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-black/10 text-left text-xs uppercase tracking-wide text-black/40">
                      <th className="px-6 py-3 font-semibold">Store</th>
                      <th className="px-6 py-3 text-right font-semibold">Orders</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Total revenue
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Net revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stores.map((s) => (
                      <tr
                        key={s.locationId}
                        className="border-b border-black/5 hover:bg-black/[0.02]"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-bold">
                          {s.name}
                        </td>
                        <td className="px-6 py-4 text-right text-black/60">
                          {s.orders}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                          {inr.format(s.gross)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-red-500">
                          {neg(s.discount)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-extrabold text-[var(--color-magenta)]">
                          {inr.format(s.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--color-cream)]">
                      <td className="px-6 py-4 font-extrabold">All stores</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {data.overall.orders}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-extrabold">
                        {inr.format(data.overall.gross)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-extrabold text-red-500">
                        {neg(data.overall.discount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-extrabold text-[var(--color-magenta)]">
                        {inr.format(data.overall.revenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.section>

            {/* CARDS 2-4: each store */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {data.stores.map((s, i) => {
                const isTop = hasSales && data.bestStore === s.name;
                const storeHasSales = s.orders > 0;

                return (
                  <motion.section
                    key={s.locationId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                    className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 ${
                      isTop
                        ? "border-[var(--color-magenta)]/30"
                        : "border-black/10"
                    }`}
                  >
                    {/* top accent line */}
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{
                        background: isTop
                          ? "var(--color-magenta)"
                          : "transparent",
                      }}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-lg font-extrabold leading-tight">
                            {s.name}
                          </p>
                          {isTop && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-magenta)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-magenta)]">
                              <Crown size={10} />
                              Top
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-black/40">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-magenta)]/10 transition-transform group-hover:scale-110 group-hover:rotate-3">
                        <Store
                          size={19}
                          className="text-[var(--color-magenta)]"
                        />
                      </div>
                    </div>

                    <p className="mt-7 text-xs font-semibold uppercase tracking-wider text-black/35">
                      Net revenue
                    </p>
                    <p
                      className={`mt-1 font-display text-4xl font-extrabold tracking-tight ${
                        storeHasSales ? "" : "text-black/25"
                      }`}
                    >
                      {inr.format(s.revenue)}
                    </p>
                    {!storeHasSales && (
                      <p className="mt-1 text-xs text-black/35">{emptyText}</p>
                    )}

                    <div className="mt-4 space-y-1.5 rounded-2xl bg-[var(--color-cream)] px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-black/45">Total revenue</span>
                        <span className="font-semibold">
                          {inr.format(s.gross)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/45">Discount</span>
                        <span className="font-semibold text-red-500">
                          {neg(s.discount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[var(--color-cream)] px-4 py-3">
                        <p className="text-[11px] font-semibold text-black/40">
                          Orders
                        </p>
                        <p className="mt-0.5 text-lg font-extrabold">
                          {s.orders}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-cream)] px-4 py-3">
                        <p className="text-[11px] font-semibold text-black/40">
                          Avg order
                        </p>
                        <p className="mt-0.5 text-lg font-extrabold">
                          {inr.format(s.average)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-black/40">
                          Share of net revenue
                        </span>
                        <span className="font-bold">{s.share}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.share}%` }}
                          transition={{ duration: 0.7, delay: 0.3 }}
                          className="h-2 rounded-full bg-[var(--color-magenta)]"
                        />
                      </div>
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}