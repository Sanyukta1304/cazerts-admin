"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

// Names come from your folder names. Reorder or rename here as you like.
const NAV = [
  {
    label: "Dashboard",
    slug: "",
    icon: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  },
  {
    label: "Sales",
    slug: "sales",
    icon: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  },
  {
    label: "Inventory",
    slug: "inventory",
    icon: "M12 3l9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8",
  },
  {
    label: "Pickup",
    slug: "pickup",
    icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  },
  {
    label: "Live tracking",
    slug: "live-tracking",
    icon: "M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z M9.5 10a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
  },
  {
    label: "Store status",
    slug: "store-status",
    icon: "M3 9l1.5-5h15L21 9 M4 9v11h16V9 M9 20v-6h6v6",
  },
  {
    label: "Feedback",
    slug: "feedback",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    label: "Photos",
    slug: "photos",
    icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M21 15l-5-5L5 21 M7 8.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 0 0-3 0",
  },
  {
    label: "Leaderboard",
    slug: "leaderboard",
    icon: "M6 20v-8 M12 20V4 M18 20v-5",
  },
  {
    label: "Team",
    slug: "team",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ location: string }>();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const location = params.location;
  const base = `/cazerts/${location}/dashboard`;
  const locationName = decodeURIComponent(location ?? "").replace(/-/g, " ");

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <aside
        className={`sticky top-0 z-20 flex h-screen shrink-0 flex-col bg-[#111111] text-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
          className="absolute -right-3 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-black shadow"
        >
          {collapsed ? "›" : "‹"}
        </button>

        <div className="px-6 pb-3 pt-6">
          <span className="font-display text-xl font-extrabold tracking-[0.25em]">
            {collapsed ? "C" : "CAZERTS"}
            <span className="text-[var(--color-magenta)]">•</span>
          </span>

          {!collapsed && (
            <p className="mt-2 truncate text-xs capitalize text-white/50">
              {locationName}
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => {
            const href = item.slug ? `${base}/${item.slug}` : base;
            const active =
              item.slug === ""
                ? pathname === base
                : pathname.startsWith(href);

            return (
              <Link
                key={item.label}
                href={href}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-magenta)] text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon d={item.icon} />

                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          <Link
            href="/cazerts"
            title="All locations"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon d="M15 18l-6-6 6-6" />

            {!collapsed && <span>All locations</span>}
          </Link>

          <Link
            href="/"
            title="All stores"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon d="M3 10.5 12 3l9 7.5 M5 9.5V20h14V9.5" />

            {!collapsed && <span>All stores</span>}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}