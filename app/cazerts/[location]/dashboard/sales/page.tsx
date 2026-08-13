"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Smartphone,
  CreditCard,
  IndianRupee,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
import {
  getTodaysOrders,
  getThisMonthsOrders,
  getOrdersForDate,
  orderTotal,
  Order,
  PaymentMethod,
  OrderMode,
} from "@/lib/orders";

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
type RangeMode = "today" | "month" | "date";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function SalesHistoryPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [range, setRange] = useState<RangeMode>("today");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    async function loadSales() {
      const orders = await getOrders(locationId);
      setAllOrders(orders);
    }
    loadSales();
  }, [locationId]);

  const displayedOrders = useMemo(() => {
    if (range === "today") return getTodaysOrders(allOrders);
    if (range === "month") return getThisMonthsOrders(allOrders);
    if (range === "date" && selectedDate) return getOrdersForDate(allOrders, selectedDate);
    return [];
  }, [allOrders, range, selectedDate]);

  // Revenue per day within the month currently shown in the calendar popover,
  // used to mark which days had sales.
  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of allOrders) {
      const d = new Date(order.createdAt);
      if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) {
        const key = dateKey(d);
        map.set(key, (map.get(key) ?? 0) + orderTotal(order));
      }
    }
    return map;
  }, [allOrders, viewMonth]);

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

  const heading =
    range === "today"
      ? "Today's Sales"
      : range === "month"
      ? "This Month's Sales"
      : selectedDate
      ? `Sales on ${selectedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : "Sales";

  const bannerLabel =
    range === "today"
      ? "Total Revenue Received Today"
      : range === "month"
      ? "Total Revenue This Month"
      : "Total Revenue on This Day";

  // ---- Calendar grid helpers ----
  const monthLabel = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const calendarCells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const today = new Date();

  function goToPrevMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  }
  function goToNextMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  }
  function pickDate(d: Date) {
    setSelectedDate(d);
    setRange("date");
    setCalendarOpen(false);
  }

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

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-white rounded-full p-1 shadow-card gap-1">
              {(["today", "month"] as RangeMode[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRange(r);
                    setSelectedDate(null);
                  }}
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

            <div className="relative">
              <button
                onClick={() => setCalendarOpen((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold shadow-card transition ${
                  range === "date"
                    ? "bg-[var(--color-magenta)] text-white"
                    : "bg-white text-black/50 hover:text-black"
                }`}
              >
                <CalendarIcon size={14} />
                {range === "date" && selectedDate
                  ? selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  : "Pick a day"}
              </button>

              {calendarOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card overflow-hidden z-20">
                  {/* Red header bar, like a classic wall calendar */}
                  <div className="bg-red-600 px-5 py-4 flex items-center justify-between">
                    <button
                      onClick={goToPrevMonth}
                      className="p-1 rounded-full hover:bg-white/20 text-white"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                      <p className="text-white font-display font-extrabold text-lg tracking-wide">
                        {monthLabel.split(" ")[0]}
                      </p>
                      <p className="text-white/80 text-xs font-semibold">{monthLabel.split(" ")[1]}</p>
                    </div>
                    <button
                      onClick={goToNextMonth}
                      className="p-1 rounded-full hover:bg-white/20 text-white"
                      aria-label="Next month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-7 mb-1">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                        <div
                          key={i}
                          className={`text-[10px] text-center font-bold uppercase py-1 ${
                            i === 0 || i === 6 ? "text-red-600" : "text-black/50"
                          }`}
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 border-l border-t border-black/10">
                      {calendarCells.map((d, i) => {
                        const col = i % 7;
                        const isWeekend = col === 0 || col === 6;
                        if (!d) {
                          return (
                            <div
                              key={i}
                              className="h-10 border-r border-b border-black/10 bg-black/[0.02]"
                            />
                          );
                        }
                        const key = dateKey(d);
                        const hasSales = revenueByDay.has(key);
                        const isToday = key === dateKey(today);
                        const isSelected = selectedDate ? key === dateKey(selectedDate) : false;
                        return (
                          <button
                            key={i}
                            onClick={() => pickDate(d)}
                            className={`relative h-10 border-r border-b border-black/10 text-xs font-bold flex items-center justify-center transition ${
                              isSelected
                                ? "bg-red-600 text-white"
                                : isToday
                                ? "bg-red-50"
                                : "hover:bg-black/5"
                            } ${!isSelected && isWeekend ? "text-red-600" : !isSelected ? "text-black/80" : ""}`}
                          >
                            {d.getDate()}
                            {hasSales && !isSelected && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate(null);
                          setRange("today");
                          setCalendarOpen(false);
                        }}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-black/40 hover:text-black py-2"
                      >
                        <X size={12} />
                        Clear selected day
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              {range === "today"
                ? "No orders placed today yet."
                : range === "month"
                ? "No orders placed this month yet."
                : "No orders placed on this day."}
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