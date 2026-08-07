"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, Smartphone, CreditCard, IndianRupee } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getLocationById } from "@/lib/locations";
import { getOrders } from "@/lib/order-store";
import { getTodaysOrders, getThisMonthsOrders, orderTotal, Order, PaymentMethod, OrderMode } from "@/lib/orders";

const paymentIcon: Record<PaymentMethod, React.ElementType> = {
  cash: Wallet,
  upi: Smartphone,
  card: CreditCard,
};

const paymentLabel: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = "cash";

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  cash: "#22c55e",
  upi: "#6366f1",
  card: "#ec4899",
};

const MODE_LABEL: Record<OrderMode, string> = {
  pickup: "Pickup",
  dinein: "Dine-in",
  delivery: "Delivery",
};

const MODE_COLORS: Record<OrderMode, string> = {
  pickup: "#f59e0b",
  dinein: "#000000",
  delivery: "#06b6d4",
};

const MODE_BADGE_CLASSES: Record<OrderMode, string> = {
  pickup: "bg-blue-50 text-blue-600",
  dinein: "bg-amber-50 text-amber-600",
  delivery: "bg-purple-50 text-purple-600",
};

const CATEGORY_COLORS = [
  "#ec4899",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
];

type ChartDatum = { name: string; value: number; color: string };
type RangeMode = "today" | "month";

export default function SalesHistoryPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [range, setRange] = useState<RangeMode>("today");
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadSales() {
      const orders = await getOrders(locationId);
      setAllOrders(orders);
    }
    loadSales();
  }, [locationId]);

  const displayedOrders = useMemo(
    () => (range === "today" ? getTodaysOrders(allOrders) : getThisMonthsOrders(allOrders)),
    [allOrders, range]
  );

  const totalRevenue = displayedOrders.reduce((sum, o) => sum + orderTotal(o), 0);
  const avgOrderValue = displayedOrders.length > 0 ? totalRevenue / displayedOrders.length : 0;

  const paymentChartData = useMemo<ChartDatum[]>(() => {
    const counts: Record<PaymentMethod, number> = { cash: 0, upi: 0, card: 0 };
    for (const order of displayedOrders) {
      const method = order.paymentMethod ?? DEFAULT_PAYMENT_METHOD;
      counts[method] += orderTotal(order);
    }
    return (Object.keys(counts) as PaymentMethod[])
      .filter((k) => counts[k] > 0)
      .map((k) => ({ name: paymentLabel[k], value: counts[k], color: PAYMENT_COLORS[k] }));
  }, [displayedOrders]);

  const modeChartData = useMemo<ChartDatum[]>(() => {
    const counts: Record<OrderMode, number> = { pickup: 0, dinein: 0, delivery: 0 };
    for (const order of displayedOrders) {
      counts[order.mode] += 1;
    }
    return (Object.keys(counts) as OrderMode[])
      .filter((k) => counts[k] > 0)
      .map((k) => ({ name: MODE_LABEL[k], value: counts[k], color: MODE_COLORS[k] }));
  }, [displayedOrders]);

  const categoryChartData = useMemo<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const order of displayedOrders) {
      for (const item of order.items) {
        counts.set(item.category, (counts.get(item.category) ?? 0) + item.qty);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
  }, [displayedOrders]);

  const heading = range === "today" ? "Today's Sales" : "This Month's Sales";
  const bannerLabel = range === "today" ? "Total Revenue Received Today" : "Total Revenue This Month";

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-14 md:px-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-8"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          {location ? location.name : "Location"}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">{heading}</h1>

          <div className="inline-flex bg-white rounded-full p-1 shadow-card gap-1">
            {(["today", "month"] as RangeMode[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition ${
                  range === r
                    ? "bg-[var(--color-magenta)] text-white"
                    : "text-black/50 hover:text-black"
                }`}
              >
                {r === "today" ? "Today" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        <p className="text-black/50 text-sm mb-8">
          {displayedOrders.length} order{displayedOrders.length !== 1 ? "s" : ""} · ₹
          {totalRevenue.toLocaleString("en-IN")} total revenue
        </p>

        {displayedOrders.length > 0 && (
          <div className="bg-gradient-to-br from-[var(--color-magenta)] to-pink-600 rounded-3xl p-8 shadow-card mb-6 text-white flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 rounded-2xl p-3">
                <IndianRupee size={28} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                  {bannerLabel}
                </p>
                <p className="font-display font-extrabold text-4xl">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase mb-1">Orders</p>
                <p className="font-bold text-2xl">{displayedOrders.length}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase mb-1">Avg. Order Value</p>
                <p className="font-bold text-2xl">
                  ₹{avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {displayedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">Items Sold by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `${value} item${Number(value) !== 1 ? "s" : ""}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 16, fontSize: 12, lineHeight: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">Revenue by Payment Method</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {paymentChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 16, fontSize: 12, lineHeight: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">Orders by Mode</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={modeChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {modeChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `${value} order${Number(value) !== 1 ? "s" : ""}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 16, fontSize: 12, lineHeight: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card">
            <p className="text-black/50">
              {range === "today" ? "No orders placed today yet." : "No orders placed this month yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-black/40 text-xs uppercase tracking-wide">
                    <th className="px-6 py-4 font-semibold">Bill No</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Items</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold text-right">Qty</th>
                    <th className="px-6 py-4 font-semibold">Mode</th>
                    <th className="px-6 py-4 font-semibold">Payment</th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((order) => {
                    const paymentMethod = order.paymentMethod ?? DEFAULT_PAYMENT_METHOD;
                    const PayIcon = paymentIcon[paymentMethod];
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] align-top"
                      >
                        <td className="px-6 py-4 font-bold text-black whitespace-nowrap">
                          {order.billNo}
                        </td>
                        <td className="px-6 py-4 text-black/70 whitespace-nowrap">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 text-black/70">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-black font-medium whitespace-nowrap">
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-black/60">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="whitespace-nowrap">
                                {item.category}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-black/60">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx}>{item.qty}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${MODE_BADGE_CLASSES[order.mode]}`}
                          >
                            {MODE_LABEL[order.mode]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/5 px-3 py-1.5 rounded-full">
                            <PayIcon size={13} />
                            {paymentLabel[paymentMethod]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-black/40 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-[var(--color-magenta)] whitespace-nowrap">
                          ₹{orderTotal(order)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}