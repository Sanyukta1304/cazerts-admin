"use client";

import { supabase } from "./supabase";
import { LOCATIONS } from "./locations";

// ---------------------------------------------------------------
// If your orders table uses different names, change these 4 lines.
// ---------------------------------------------------------------
const ORDERS_TABLE = "orders";
const COL_LOCATION = "location_id";
const COL_TOTAL = "total";
const COL_DATE = "created_at";

const IST_OFFSET_MS = 330 * 60 * 1000; // India time, UTC+5:30

export type Period = "today" | "week" | "month" | "all" | "custom";

// "custom" is not listed here, the page adds its own Custom tab.
export const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

// Dates are "YYYY-MM-DD" strings in India time (what <input type="date"> gives).
export type CustomRange = { from: string; to: string };

export type StoreSales = {
  locationId: string;
  name: string;
  address: string;
  revenue: number;
  orders: number;
  average: number;
  share: number; // % of all-store sales
};

export type SalesSummary = {
  overall: { revenue: number; orders: number; average: number };
  bestStore: string | null;
  stores: StoreSales[];
};

// ---------- date helpers (all India time) ----------

// Today's date in India, as "YYYY-MM-DD".
export function todayIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// Add/subtract days from a "YYYY-MM-DD" string.
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// 12:00 am India time on the given "YYYY-MM-DD", as a real Date.
function dayStart(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

// Start of the chosen period, in India time (week starts on Monday).
function periodStart(period: Period, now: Date = new Date()): Date | null {
  if (period === "all" || period === "custom") return null;

  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();

  if (period === "today") {
    return new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);
  }

  if (period === "week") {
    const sinceMonday = (ist.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(y, m, d - sinceMonday) - IST_OFFSET_MS);
  }

  return new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
}

// Start (inclusive) and end (exclusive) for the chosen period.
function periodBounds(
  period: Period,
  range?: CustomRange | null
): { since: Date | null; until: Date | null } {
  if (period === "custom") {
    if (!range) return { since: null, until: null };
    return {
      since: dayStart(range.from),
      // end of the "To" day = start of the next day
      until: dayStart(shiftDate(range.to, 1)),
    };
  }
  return { since: periodStart(period), until: null };
}

// Reads every order in the period (Supabase returns 1000 rows at a time,
// so this keeps fetching until there are no more).
async function fetchOrders(
  since: Date | null,
  until: Date | null
): Promise<any[]> {
  const pageSize = 1000;
  const rows: any[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from(ORDERS_TABLE)
      .select(`${COL_LOCATION}, ${COL_TOTAL}`);

    if (since) query = query.gte(COL_DATE, since.toISOString());
    if (until) query = query.lt(COL_DATE, until.toISOString());

    const { data, error } = await query
      .order(COL_DATE, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }

    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

export async function getSalesSummary(
  period: Period,
  range?: CustomRange | null
): Promise<SalesSummary> {
  const { since, until } = periodBounds(period, range);
  const orders = await fetchOrders(since, until);

  const stores: StoreSales[] = LOCATIONS.map((loc) => {
    const mine = orders.filter((o) => o[COL_LOCATION] === loc.id);
    const revenue = mine.reduce((sum, o) => sum + (Number(o[COL_TOTAL]) || 0), 0);

    return {
      locationId: loc.id,
      name: loc.name,
      address: loc.address,
      revenue,
      orders: mine.length,
      average: mine.length > 0 ? revenue / mine.length : 0,
      share: 0,
    };
  });

  const totalRevenue = stores.reduce((s, x) => s + x.revenue, 0);
  const totalOrders = stores.reduce((s, x) => s + x.orders, 0);

  for (const s of stores) {
    s.share = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0;
  }

  const best = [...stores].sort((a, b) => b.revenue - a.revenue)[0];

  return {
    overall: {
      revenue: totalRevenue,
      orders: totalOrders,
      average: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    bestStore: best && best.revenue > 0 ? best.name : null,
    stores,
  };
}