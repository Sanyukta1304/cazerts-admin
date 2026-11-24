"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Camera,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Loader2,
  MapPin,
  MessageSquareText,
  Package,
  X,
} from "lucide-react";
import { closeStore, getStoreClosure, openStoreNow } from "@/lib/storeClosure";
import {
  HOURS_LABEL,
  resolveStoreState,
  StoreOverride,
} from "@/lib/store-hours";

const QUICK_LINKS = [
  { label: "Sales", description: "View sales", slug: "sales", icon: BarChart3 },
  { label: "Inventory", description: "Manage stock", slug: "inventory", icon: Boxes },
  { label: "Pickup", description: "Manage pickups", slug: "pickup", icon: Package },
  { label: "Live tracking", description: "Track deliveries", slug: "live-tracking", icon: MapPin },
  
];

const REASON_OPTIONS = [
  "We're outside our opening hours.",
  "Out of stock",
  "Staff shortage",
  "Power cut",
  "Maintenance",
  "Festival / holiday",
  "Bad weather",
];

export default function DashboardPage() {
  const params = useParams<{ location: string }>();

  const location = decodeURIComponent(params.location ?? "").replace(/-/g, " ");

  const locationName = location
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const base = `/cazerts/${params.location}/dashboard`;

  const [override, setOverride] = useState<StoreOverride | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // "Close store" popup
  const [showModal, setShowModal] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");

  // Load the saved override now, then refresh every 30 seconds so the
  // screen also flips by itself at 2:00 PM and 12:00 AM.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const o = await getStoreClosure(params.location);
        if (!cancelled) {
          setOverride(o);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) {
          setNow(new Date());
          setLoaded(true);
        }
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.location]);

  // Close the popup with the Escape key
  useEffect(() => {
    if (!showModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) setShowModal(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, saving]);

  // What the customers see right now
  const state = loaded ? resolveStoreState(override, now) : null;
  const isOpen = state !== null && state.state === "open";
  const openedEarly =
    state !== null && state.state === "open" && state.source === "admin";
  const closedByAdmin =
    state !== null && state.state === "closed" && state.source === "admin";
  const closedBySchedule =
    state !== null && state.state === "closed" && state.source === "schedule";
  const shownReason =
    state !== null && state.state === "closed" && state.source === "admin"
      ? state.reason
      : "";

  async function handleOpen() {
    setSaving(true);
    setError("");
    try {
      const until = await openStoreNow(params.location);
      setOverride({ isClosed: false, reason: "", forceOpenUntil: until });
      setNow(new Date());
    } catch {
      setError("Couldn't open the store. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmClose() {
    const reason = reasonDraft.trim();
    if (reason.length < 3) return;

    setSaving(true);
    setError("");
    try {
      await closeStore(params.location, reason);
      setOverride({ isClosed: true, reason, forceOpenUntil: null });
      setNow(new Date());
      setShowModal(false);
      setReasonDraft("");
    } catch {
      setError("Couldn't close the store. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleStatusButton() {
    if (isOpen) {
      setReasonDraft("");
      setError("");
      setShowModal(true);
    } else {
      handleOpen();
    }
  }

  const canConfirm = reasonDraft.trim().length >= 3 && !saving;

  // Texts for the status card
  let title = "Checking status...";
  let subtitle = "Please wait a moment.";
  let badge = "";

  if (loaded) {
    if (openedEarly) {
      title = "Your store is open";
      subtitle = "You opened it early. It closes automatically at 12:00 AM.";
      badge = "Open now";
    } else if (isOpen) {
      title = "Your store is open";
      subtitle = "Customers can currently place orders.";
      badge = "Open now";
    } else if (closedByAdmin) {
      title = "Your store is closed";
      subtitle = "Customers cannot currently place orders.";
      badge = "Closed";
    } else {
      title = "Your store is closed for now";
      subtitle =
        "It's outside opening hours. It opens by itself at 2:00 PM, or you can open it now.";
      badge = "Closed · opens 2:00 PM";
    }
  }

  const buttonLabel = isOpen
    ? "Close store"
    : closedBySchedule
    ? "Open store now"
    : "Open store";

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 pt-7 md:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm text-black/45 transition-colors hover:text-black"
        >
          <ChevronRight
            size={16}
            className="rotate-180 transition-transform group-hover:-translate-x-0.5"
          />
          Log out
        </Link>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-8 pb-12 pt-16 md:px-12">
        {/* Heading */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
            Cazerts Admin
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              {locationName}
            </h1>

            {loaded && (
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOpen ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {badge}
              </div>
            )}
          </div>

          <p className="mt-3 text-base text-black/45">
            Manage your store from one place.
          </p>
        </div>

        {(error || loadFailed) && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error || "Couldn't load the store status. Try refreshing."}
          </div>
        )}

        {/* Store status */}
        <section className="mt-10 rounded-[2rem] bg-white p-7 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  isOpen ? "bg-green-50" : "bg-red-50"
                }`}
              >
                {isOpen ? (
                  <CircleCheck size={25} className="text-green-600" />
                ) : (
                  <CircleX size={25} className="text-red-500" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/35">
                  Store status
                </p>

                <h2 className="mt-1 font-display text-xl font-extrabold">
                  {title}
                </h2>

                <p className="mt-1 max-w-md text-sm text-black/45">{subtitle}</p>

                {loaded && closedByAdmin && shownReason && (
                  <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    <MessageSquareText size={15} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">
                        Reason shown to customers:
                      </span>{" "}
                      {shownReason}
                    </span>
                  </p>
                )}

                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-black/35">
                  <Clock size={13} />
                  Store hours: {HOURS_LABEL} (India time)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStatusButton}
              disabled={!loaded || saving}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100 ${
                isOpen ? "bg-black" : "bg-[var(--color-magenta)]"
              }`}
            >
              {saving && !showModal && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {buttonLabel}
            </button>
          </div>
        </section>

        {/* Quick access */}
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/30">
                Workspace
              </p>

              <h2 className="mt-1 font-display text-2xl font-extrabold">
                Quick access
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.slug}
                  href={`${base}/${item.slug}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-cream)]">
                    <Icon
                      size={19}
                      className="text-black/60 transition-colors group-hover:text-[var(--color-magenta)]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold">{item.label}</p>
                    <p className="mt-0.5 text-xs text-black/40">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-black/20 transition-all group-hover:translate-x-1 group-hover:text-black/60"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Close-store popup */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !saving && setShowModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-extrabold">
                    Close your store?
                  </h3>
                  <p className="mt-1 text-sm text-black/45">
                    Customers will see this reason on the website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  aria-label="Cancel"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-2 mt-6 text-xs font-semibold text-black/50">
                Quick reasons
              </p>
              <div className="flex flex-wrap gap-2">
                {REASON_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReasonDraft(r)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      reasonDraft === r
                        ? "border-[var(--color-magenta)] bg-[var(--color-magenta)]/10 text-[var(--color-magenta)]"
                        : "border-black/10 text-black/55 hover:border-black/25 hover:text-black"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <label className="mb-2 mt-5 block text-xs font-semibold text-black/50">
                Reason for closing
              </label>
              <textarea
                value={reasonDraft}
                onChange={(e) => setReasonDraft(e.target.value)}
                maxLength={120}
                rows={3}
                placeholder="e.g. We ran out of stock and will be back tomorrow"
                className="w-full resize-none rounded-2xl border border-black/15 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-magenta)]"
              />
              <p className="mt-1 text-right text-[11px] text-black/30">
                {reasonDraft.length}/120
              </p>

              {error && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-full bg-black/5 py-3 text-sm font-bold text-black/60 hover:bg-black/10 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClose}
                  disabled={!canConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Close store
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}