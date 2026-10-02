"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Camera,
  ChevronRight,
  CircleCheck,
  CircleX,
  MapPin,
  Package,
  Store,
  Users,
} from "lucide-react";

const QUICK_LINKS = [
  {
    label: "Sales",
    description: "View sales",
    slug: "sales",
    icon: BarChart3,
  },
  {
    label: "Inventory",
    description: "Manage stock",
    slug: "inventory",
    icon: Boxes,
  },
  {
    label: "Pickup",
    description: "Manage pickups",
    slug: "pickup",
    icon: Package,
  },
  {
    label: "Live tracking",
    description: "Track deliveries",
    slug: "live-tracking",
    icon: MapPin,
  },
  {
    label: "Photos",
    description: "Store photos",
    slug: "photos",
    icon: Camera,
  },
  {
    label: "Team",
    description: "Manage team",
    slug: "team",
    icon: Users,
  },
];

export default function DashboardPage() {
  const params = useParams<{ location: string }>();

  const location = decodeURIComponent(params.location ?? "").replace(
    /-/g,
    " "
  );

  const locationName = location
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const base = `/cazerts/${params.location}/dashboard`;

  const [storeOpen, setStoreOpen] = useState(true);

  // Keep the store status after refreshing the page.
  useEffect(() => {
    const savedStatus = localStorage.getItem(
      `cazerts-store-status-${params.location}`
    );

    if (savedStatus !== null) {
      setStoreOpen(savedStatus === "open");
    }
  }, [params.location]);

  function toggleStore() {
    const nextStatus = !storeOpen;

    setStoreOpen(nextStatus);

    localStorage.setItem(
      `cazerts-store-status-${params.location}`,
      nextStatus ? "open" : "closed"
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 pt-7 md:px-12">
        <Link
          href="/cazerts"
          className="group flex items-center gap-2 text-sm text-black/45 transition-colors hover:text-black"
        >
          <ChevronRight
            size={16}
            className="rotate-180 transition-transform group-hover:-translate-x-0.5"
          />
          Switch location
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

            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                storeOpen
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  storeOpen ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {storeOpen ? "Open now" : "Closed"}
            </div>
          </div>

          <p className="mt-3 text-base text-black/45">
            Manage your store from one place.
          </p>
        </div>

        {/* Store status */}
        <section className="mt-10 rounded-[2rem] bg-white p-7 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  storeOpen ? "bg-green-50" : "bg-red-50"
                }`}
              >
                {storeOpen ? (
                  <CircleCheck
                    size={25}
                    className="text-green-600"
                  />
                ) : (
                  <CircleX
                    size={25}
                    className="text-red-500"
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/35">
                  Store status
                </p>

                <h2 className="mt-1 font-display text-xl font-extrabold">
                  {storeOpen ? "Your store is open" : "Your store is closed"}
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  {storeOpen
                    ? "Customers can currently place orders."
                    : "Customers cannot currently place orders."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleStore}
              className={`rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] ${
                storeOpen
                  ? "bg-black"
                  : "bg-[var(--color-magenta)]"
              }`}
            >
              {storeOpen ? "Close store" : "Open store"}
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
                    <p className="font-display text-sm font-bold">
                      {item.label}
                    </p>

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
    </main>
  );
}