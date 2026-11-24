"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Image as ImageIcon, LogOut, Ticket } from "lucide-react";
import { SUPER_ADMIN_FLAG } from "@/lib/superadmin";

const NAV = [
  { label: "Sales", short: "Sales", href: "/superadmin/sales", icon: BarChart3 },
  { label: "Photos", short: "Photos", href: "/superadmin/photos", icon: ImageIcon },
  { label: "Promo codes", short: "Promos", href: "/superadmin/promocodes", icon: Ticket },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // Light guard: only people who signed in as super admin get in.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SUPER_ADMIN_FLAG) === "1") {
        setAllowed(true);
        return;
      }
    } catch {
      // sessionStorage unavailable; fall through to the redirect
    }
    router.replace("/");
  }, [router]);

  function logOut() {
    try {
      sessionStorage.removeItem(SUPER_ADMIN_FLAG);
    } catch {}
    router.push("/");
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-[var(--color-cream)] lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-black text-white lg:flex">
        <div className="px-7 pb-6 pt-8">
          <p className="font-display text-2xl font-extrabold tracking-[0.25em]">
            CAZERTS<span className="ml-1 text-[var(--color-magenta)]">●</span>
          </p>
          <p className="mt-1 text-xs text-white/40">Super Admin</p>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 pt-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--color-magenta)] text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-5">
          <button
            type="button"
            onClick={logOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="flex items-center justify-between bg-black px-5 py-4 text-white lg:hidden">
        <p className="font-display text-lg font-extrabold tracking-[0.2em]">
          CAZERTS<span className="ml-1 text-[var(--color-magenta)]">●</span>
        </p>
        <div className="flex items-center gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-xs font-bold ${
                pathname.startsWith(item.href)
                  ? "bg-[var(--color-magenta)]"
                  : "bg-white/10"
              }`}
            >
              {item.short}
            </Link>
          ))}
          <button
            type="button"
            onClick={logOut}
            aria-label="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* pt-10 on desktop keeps page content clear of the RelogFoods mark */}
      <div className="min-w-0 flex-1 lg:pt-10">{children}</div>
    </div>
  );
}