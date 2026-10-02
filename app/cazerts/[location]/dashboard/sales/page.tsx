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
  orderTotal,
  Order,
  PaymentMethod,
  OrderMode,
} from "@/lib/orders";

const paymentIcon: Record<
  PaymentMethod,
  React.ElementType
> = {
  cash: Wallet,
  upi: Smartphone,
  card: CreditCard,
};

const paymentLabel: Record<
  PaymentMethod,
  string
> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = "cash";

const PAYMENT_COLORS: Record<
  PaymentMethod,
  string
> = {
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

const MODE_BADGE_CLASSES: Record<
  OrderMode,
  string
> = {
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

type ChartDatum = {
  name: string;
  value: number;
  color: string;
};

type RangeMode =
  | "today"
  | "month"
  | "custom";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(
  a: Date | null,
  b: Date | null
): boolean {
  if (!a || !b) return false;

  return dateKey(a) === dateKey(b);
}

function isBetweenDates(
  date: Date,
  start: Date | null,
  end: Date | null
): boolean {
  if (!start || !end) return false;

  const current = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();

  const startTime = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();

  const endTime = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  ).getTime();

  return (
    current > startTime &&
    current < endTime
  );
}

function formatDate(
  date: Date | null
): string {
  if (!date) return "";

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function SalesHistoryPage() {
  const params = useParams();

  const locationId =
    params.location as string;

  const location =
    getLocationById(locationId);

  const [range, setRange] =
    useState<RangeMode>("today");

  const [allOrders, setAllOrders] =
    useState<Order[]>([]);

  // Custom date range
  const [customStartDate, setCustomStartDate] =
    useState<Date | null>(null);

  const [customEndDate, setCustomEndDate] =
    useState<Date | null>(null);

  // Temporary dates while calendar is open
  const [pendingStartDate, setPendingStartDate] =
    useState<Date | null>(null);

  const [pendingEndDate, setPendingEndDate] =
    useState<Date | null>(null);

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  // Left month shown in the two-month calendar
  const [calendarMonth, setCalendarMonth] =
    useState<Date>(new Date());

  useEffect(() => {
    async function loadSales() {
      const orders =
        await getOrders(locationId);

      setAllOrders(orders);
    }

    loadSales();
  }, [locationId]);

  /*
   * Orders shown according to the selected range.
   */
  const displayedOrders = useMemo(() => {
    if (range === "today") {
      return getTodaysOrders(allOrders);
    }

    if (range === "month") {
      return getThisMonthsOrders(allOrders);
    }

    if (
      range === "custom" &&
      customStartDate &&
      customEndDate
    ) {
      const start = new Date(
        customStartDate.getFullYear(),
        customStartDate.getMonth(),
        customStartDate.getDate(),
        0,
        0,
        0,
        0
      );

      const end = new Date(
        customEndDate.getFullYear(),
        customEndDate.getMonth(),
        customEndDate.getDate(),
        23,
        59,
        59,
        999
      );

      return allOrders.filter(
        (order) => {
          const orderDate =
            new Date(order.createdAt);

          return (
            orderDate >= start &&
            orderDate <= end
          );
        }
      );
    }

    return [];
  }, [
    allOrders,
    range,
    customStartDate,
    customEndDate,
  ]);

  const totalRevenue =
    displayedOrders.reduce(
      (sum, o) =>
        sum + orderTotal(o),
      0
    );

  const avgOrderValue =
    displayedOrders.length > 0
      ? totalRevenue /
        displayedOrders.length
      : 0;

  /*
   * PAYMENT CHART
   */
  const paymentChartData =
    useMemo<ChartDatum[]>(() => {
      const counts: Record<
        PaymentMethod,
        number
      > = {
        cash: 0,
        upi: 0,
        card: 0,
      };

      for (const order of displayedOrders) {
        const method =
          order.paymentMethod ??
          DEFAULT_PAYMENT_METHOD;

        counts[method] +=
          orderTotal(order);
      }

      return (
        Object.keys(
          counts
        ) as PaymentMethod[]
      )
        .filter(
          (k) => counts[k] > 0
        )
        .map((k) => ({
          name: paymentLabel[k],
          value: counts[k],
          color: PAYMENT_COLORS[k],
        }));
    }, [displayedOrders]);

  /*
   * MODE CHART
   */
  const modeChartData =
    useMemo<ChartDatum[]>(() => {
      const counts: Record<
        OrderMode,
        number
      > = {
        pickup: 0,
        dinein: 0,
        delivery: 0,
      };

      for (const order of displayedOrders) {
        counts[order.mode] += 1;
      }

      return (
        Object.keys(
          counts
        ) as OrderMode[]
      )
        .filter(
          (k) => counts[k] > 0
        )
        .map((k) => ({
          name: MODE_LABEL[k],
          value: counts[k],
          color: MODE_COLORS[k],
        }));
    }, [displayedOrders]);

  /*
   * CATEGORY CHART
   */
  const categoryChartData =
    useMemo<ChartDatum[]>(() => {
      const counts =
        new Map<string, number>();

      for (const order of displayedOrders) {
        for (const item of order.items) {
          counts.set(
            item.category,
            (counts.get(
              item.category
            ) ?? 0) + item.qty
          );
        }
      }

      return Array.from(
        counts.entries()
      )
        .sort(
          (a, b) => b[1] - a[1]
        )
        .map(
          ([name, value], i) => ({
            name,
            value,
            color:
              CATEGORY_COLORS[
                i %
                  CATEGORY_COLORS.length
              ],
          })
        );
    }, [displayedOrders]);

  /*
   * PAGE HEADING
   */
  const heading =
    range === "today"
      ? "Today's Sales"
      : range === "month"
      ? "This Month's Sales"
      : customStartDate &&
        customEndDate
      ? `Sales from ${formatDate(
          customStartDate
        )} to ${formatDate(
          customEndDate
        )}`
      : "Custom Sales";

  const bannerLabel =
    range === "today"
      ? "Total Revenue Received Today"
      : range === "month"
      ? "Total Revenue This Month"
      : "Total Revenue for Selected Dates";

  /*
   * CALENDAR HELPERS
   */

  const today = new Date();

  const leftMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  );

  const rightMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    1
  );

  function createCalendarDays(
    month: Date
  ): (Date | null)[] {
    const firstDay = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    );

    const startOffset =
      firstDay.getDay();

    const daysInMonth =
      new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0
      ).getDate();

    return [
      ...Array.from(
        { length: startOffset },
        () => null
      ),
      ...Array.from(
        { length: daysInMonth },
        (_, i) =>
          new Date(
            month.getFullYear(),
            month.getMonth(),
            i + 1
          )
      ),
    ];
  }

  const leftCalendarDays =
    createCalendarDays(leftMonth);

  const rightCalendarDays =
    createCalendarDays(rightMonth);

  function goToPreviousMonth() {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() - 1,
        1
      )
    );
  }

  function goToNextMonth() {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        1
      )
    );
  }

  /*
   * DATE CLICK BEHAVIOUR
   */
  function handleDateClick(
    date: Date
  ) {
    if (
      !pendingStartDate ||
      (pendingStartDate &&
        pendingEndDate)
    ) {
      setPendingStartDate(date);
      setPendingEndDate(null);
      return;
    }

    if (
      date.getTime() <
      pendingStartDate.getTime()
    ) {
      setPendingStartDate(date);
      setPendingEndDate(null);
      return;
    }

    setPendingEndDate(date);
  }

  function applyCustomDates() {
    if (
      !pendingStartDate ||
      !pendingEndDate
    )
      return;

    setCustomStartDate(
      pendingStartDate
    );

    setCustomEndDate(
      pendingEndDate
    );

    setRange("custom");
    setCalendarOpen(false);
  }

  function openCustomCalendar() {
    setPendingStartDate(
      customStartDate
    );

    setPendingEndDate(
      customEndDate
    );

    if (customStartDate) {
      setCalendarMonth(
        new Date(
          customStartDate.getFullYear(),
          customStartDate.getMonth(),
          1
        )
      );
    } else {
      setCalendarMonth(
        new Date()
      );
    }

    setCalendarOpen(true);
  }

  function clearCustomDates() {
    setCustomStartDate(null);
    setCustomEndDate(null);

    setPendingStartDate(null);
    setPendingEndDate(null);

    setRange("today");
    setCalendarOpen(false);
  }

  function renderCalendar(
    days: (Date | null)[],
    month: Date
  ) {
    return (
      <div className="w-[250px]">
        <div className="grid grid-cols-7 mb-2">
          {[
            "Su",
            "Mo",
            "Tu",
            "We",
            "Th",
            "Fr",
            "Sa",
          ].map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-semibold text-black/40 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map(
            (date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-8"
                  />
                );
              }

              const isStart =
                isSameDay(
                  date,
                  pendingStartDate
                );

              const isEnd =
                isSameDay(
                  date,
                  pendingEndDate
                );

              const isInRange =
                isBetweenDates(
                  date,
                  pendingStartDate,
                  pendingEndDate
                );

              const isToday =
                isSameDay(
                  date,
                  today
                );

              return (
                <button
                  key={dateKey(date)}
                  type="button"
                  onClick={() =>
                    handleDateClick(
                      date
                    )
                  }
                  className={`
                    relative mx-auto h-8 w-8 rounded-full
                    text-xs font-semibold transition
                    ${
                      isStart || isEnd
                        ? "bg-[var(--color-magenta)] text-white"
                        : isInRange
                        ? "bg-pink-50 text-[var(--color-magenta)]"
                        : isToday
                        ? "border border-[var(--color-magenta)] text-[var(--color-magenta)]"
                        : "text-black/75 hover:bg-black/5"
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-14 md:px-12">
      <div className="max-w-5xl mx-auto">
        {/* BACK */}
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-8"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* LOCATION */}
        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          {location
            ? location.name
            : "Location"}
        </p>

        {/* HEADING + FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">
            {heading}
          </h1>

          <div className="flex items-center gap-2">
            {/* TODAY / THIS MONTH */}
            <div className="inline-flex bg-white rounded-full p-1 shadow-card gap-1">
              {(
                ["today", "month"] as RangeMode[]
              ).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r);
                    setCalendarOpen(false);

                    if (
                      r !== "custom"
                    ) {
                      setCustomStartDate(
                        null
                      );
                      setCustomEndDate(
                        null
                      );
                      setPendingStartDate(
                        null
                      );
                      setPendingEndDate(
                        null
                      );
                    }
                  }}
                  className={`
                    px-4 py-2 rounded-full text-xs
                    font-bold transition
                    ${
                      range === r
                        ? "bg-[var(--color-magenta)] text-white"
                        : "text-black/50 hover:text-black"
                    }
                  `}
                >
                  {r === "today"
                    ? "Today"
                    : "This Month"}
                </button>
              ))}
            </div>

            {/* CUSTOM DATES */}
            <div className="relative">
              <button
                type="button"
                onClick={
                  openCustomCalendar
                }
                className={`
                  inline-flex items-center gap-2
                  px-4 py-2.5 rounded-full text-xs
                  font-bold shadow-card transition
                  ${
                    range === "custom"
                      ? "bg-[var(--color-magenta)] text-white"
                      : "bg-white text-black/50 hover:text-black"
                  }
                `}
              >
                <CalendarIcon size={14} />

                {range === "custom" &&
                customStartDate &&
                customEndDate
                  ? `${customStartDate.toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                      }
                    )} – ${customEndDate.toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                      }
                    )}`
                  : "Custom dates"}
              </button>

              {/* SMALL TWO-MONTH CALENDAR */}
              {calendarOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-2
                    w-[590px] max-w-[calc(100vw-32px)]
                    bg-white rounded-2xl
                    shadow-[0_12px_35px_rgba(0,0,0,0.15)]
                    border border-black/5
                    overflow-hidden
                    z-50
                  "
                >
                  {/* HEADER */}
                  <div className="px-5 py-4 border-b border-black/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-extrabold text-base">
                          Select date range
                        </p>

                        <p className="text-xs text-black/40 mt-1">
                          {!pendingStartDate
                            ? "Select a start date"
                            : !pendingEndDate
                            ? `Start: ${formatDate(
                                pendingStartDate
                              )} · Select an end date`
                            : `${formatDate(
                                pendingStartDate
                              )} – ${formatDate(
                                pendingEndDate
                              )}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCalendarOpen(
                            false
                          )
                        }
                        className="p-1.5 rounded-full text-black/35 hover:bg-black/5 hover:text-black"
                        aria-label="Close calendar"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* MONTH NAVIGATION */}
                  <div className="px-5 pt-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={
                          goToPreviousMonth
                        }
                        className="
                          h-8 w-8 rounded-full
                          flex items-center justify-center
                          text-black/50
                          hover:bg-black/5
                          hover:text-black
                        "
                        aria-label="Previous month"
                      >
                        <ChevronLeft
                          size={18}
                        />
                      </button>

                      <div className="grid grid-cols-2 gap-12 flex-1 text-center">
                        <p className="font-display font-extrabold text-base">
                          {leftMonth.toLocaleDateString(
                            "en-IN",
                            {
                              month:
                                "long",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <p className="font-display font-extrabold text-base">
                          {rightMonth.toLocaleDateString(
                            "en-IN",
                            {
                              month:
                                "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          goToNextMonth
                        }
                        className="
                          h-8 w-8 rounded-full
                          flex items-center justify-center
                          text-black/50
                          hover:bg-black/5
                          hover:text-black
                        "
                        aria-label="Next month"
                      >
                        <ChevronRight
                          size={18}
                        />
                      </button>
                    </div>
                  </div>

                  {/* CALENDARS */}
                  <div className="px-5 py-4">
                    <div className="flex justify-center gap-8">
                      {renderCalendar(
                        leftCalendarDays,
                        leftMonth
                      )}

                      {renderCalendar(
                        rightCalendarDays,
                        rightMonth
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-black/10 px-5 py-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={
                        clearCustomDates
                      }
                      className="
                        text-xs font-semibold
                        text-black/40
                        hover:text-black
                      "
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      disabled={
                        !pendingStartDate ||
                        !pendingEndDate
                      }
                      onClick={
                        applyCustomDates
                      }
                      className={`
                        px-5 py-2.5 rounded-full
                        text-xs font-bold transition
                        ${
                          pendingStartDate &&
                          pendingEndDate
                            ? "bg-[var(--color-magenta)] text-white hover:opacity-90"
                            : "bg-black/5 text-black/25 cursor-not-allowed"
                        }
                      `}
                    >
                      Apply Dates
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUBTITLE */}
        <p className="text-black/50 text-sm mb-8">
          {displayedOrders.length} order
          {displayedOrders.length !== 1
            ? "s"
            : ""}{" "}
          · ₹
          {totalRevenue.toLocaleString(
            "en-IN"
          )}{" "}
          total revenue
        </p>

        {/* REVENUE BANNER */}
        {displayedOrders.length > 0 && (
          <div className="bg-gradient-to-br from-[var(--color-magenta)] to-pink-600 rounded-3xl p-8 shadow-card mb-6 text-white flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 rounded-2xl p-3">
                <IndianRupee
                  size={28}
                />
              </div>

              <div>
                <p className="text-white/70 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                  {bannerLabel}
                </p>

                <p className="font-display font-extrabold text-4xl">
                  ₹
                  {totalRevenue.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase mb-1">
                  Orders
                </p>

                <p className="font-bold text-2xl">
                  {displayedOrders.length}
                </p>
              </div>

              <div>
                <p className="text-white/70 text-xs font-semibold uppercase mb-1">
                  Avg. Order Value
                </p>

                <p className="font-bold text-2xl">
                  ₹
                  {avgOrderValue.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHARTS */}
        {displayedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* CATEGORY */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">
                Items Sold by Category
              </h2>

              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <Pie
                    data={
                      categoryChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryChartData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value: any
                    ) =>
                      `${value} item${
                        Number(
                          value
                        ) !== 1
                          ? "s"
                          : ""
                      }`
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: 16,
                      fontSize: 12,
                      lineHeight:
                        "20px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">
                Revenue by Payment Method
              </h2>

              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <Pie
                    data={
                      paymentChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {paymentChartData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value: any
                    ) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: 16,
                      fontSize: 12,
                      lineHeight:
                        "20px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* MODE */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="font-bold text-black mb-2">
                Orders by Mode
              </h2>

              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
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
                    {modeChartData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value: any
                    ) =>
                      `${value} order${
                        Number(
                          value
                        ) !== 1
                          ? "s"
                          : ""
                      }`
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: 16,
                      fontSize: 12,
                      lineHeight:
                        "20px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* NO ORDERS */}
        {displayedOrders.length ===
        0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card">
            <p className="text-black/50">
              {range === "today"
                ? "No orders placed today yet."
                : range === "month"
                ? "No orders placed this month yet."
                : customStartDate &&
                  customEndDate
                ? "No orders placed in the selected date range."
                : "Select a start and end date to view sales."}
            </p>
          </div>
        ) : (
          /* SALES TABLE */
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-black/40 text-xs uppercase tracking-wide">
                    <th className="px-6 py-4 font-semibold">
                      Bill No
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Items
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Category
                    </th>

                    <th className="px-6 py-4 font-semibold text-right">
                      Qty
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Mode
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Payment
                    </th>

                    {/* DATE ADDED */}
                    <th className="px-6 py-4 font-semibold">
                      Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Time
                    </th>

                    <th className="px-6 py-4 font-semibold text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayedOrders.map(
                    (order) => {
                      const paymentMethod =
                        order.paymentMethod ??
                        DEFAULT_PAYMENT_METHOD;

                      const PayIcon =
                        paymentIcon[
                          paymentMethod
                        ];

                      const orderDate =
                        new Date(
                          order.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        );

                      const orderTime =
                        new Date(
                          order.createdAt
                        ).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        );

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] align-top"
                        >
                          <td className="px-6 py-4 font-bold text-black whitespace-nowrap">
                            {order.billNo}
                          </td>

                          <td className="px-6 py-4 text-black/70 whitespace-nowrap">
                            {
                              order.customerName
                            }
                          </td>

                          <td className="px-6 py-4 text-black/70">
                            <div className="space-y-1">
                              {order.items.map(
                                (
                                  item,
                                  idx
                                ) => (
                                  <div
                                    key={
                                      idx
                                    }
                                    className="text-black font-medium whitespace-nowrap"
                                  >
                                    {
                                      item.name
                                    }
                                  </div>
                                )
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-black/60">
                            <div className="space-y-1">
                              {order.items.map(
                                (
                                  item,
                                  idx
                                ) => (
                                  <div
                                    key={
                                      idx
                                    }
                                    className="whitespace-nowrap"
                                  >
                                    {
                                      item.category
                                    }
                                  </div>
                                )
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right text-black/60">
                            <div className="space-y-1">
                              {order.items.map(
                                (
                                  item,
                                  idx
                                ) => (
                                  <div
                                    key={
                                      idx
                                    }
                                  >
                                    {
                                      item.qty
                                    }
                                  </div>
                                )
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`
                                text-xs font-bold
                                px-3 py-1.5 rounded-full
                                capitalize
                                ${MODE_BADGE_CLASSES[order.mode]}
                              `}
                            >
                              {
                                MODE_LABEL[
                                  order.mode
                                ]
                              }
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/5 px-3 py-1.5 rounded-full">
                              <PayIcon
                                size={13}
                              />

                              {
                                paymentLabel[
                                  paymentMethod
                                ]
                              }
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="px-6 py-4 text-black/50 text-xs whitespace-nowrap">
                            {orderDate}
                          </td>

                          {/* TIME */}
                          <td className="px-6 py-4 text-black/40 text-xs whitespace-nowrap">
                            {orderTime}
                          </td>

                          <td className="px-6 py-4 text-right font-extrabold text-[var(--color-magenta)] whitespace-nowrap">
                            ₹
                            {orderTotal(
                              order
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}