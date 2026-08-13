// ============================================
// ORDERS — demo data for now.
// Once a real backend/database is connected, replace this
// with live data fetched from the database instead of mock orders.
// ============================================

export type OrderMode = "pickup" | "dinein" | "delivery";
export type PaymentMethod = "cash" | "upi" | "card";
export type CustomerGender = "male" | "female";

export type OrderStatus = "pending" | "processing" | "ready" | "completed";

export type OrderItem = {
  name: string;
  category: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  billNo: string;
  locationId: string;
  customerName: string;
  customerGender: CustomerGender;
  customerAvatarId: string | null;
  items: OrderItem[];
  mode: OrderMode;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
};

// Order the statuses move through when staff advance an order forward.
export const STATUS_FLOW: OrderStatus[] = ["pending", "processing", "ready", "completed"];

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(status);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

let billCounter = 1042;

export function generateBillNo(): string {
  billCounter += 1;
  return `CZT-${billCounter}`;
}

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    billNo: "CZT-1038",
    locationId: "indiranagar",
    customerName: "Ananya Sharma",
    customerGender: "female",
    customerAvatarId: null,
    items: [
      { name: "Death By Chocolate", category: "Sundaes", qty: 1, price: 349 },
      { name: "Belgian Waffle & Ice Cream", category: "Waffles", qty: 1, price: 229 },
    ],
    mode: "dinein",
    paymentMethod: "upi",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "o2",
    billNo: "CZT-1039",
    locationId: "indiranagar",
    customerName: "Rahul Mehta",
    customerGender: "male",
    customerAvatarId: null,
    items: [{ name: "Red Velvet Cake Can", category: "Cake Cans", qty: 2, price: 259 }],
    mode: "pickup",
    paymentMethod: "cash",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "o3",
    billNo: "CZT-1040",
    locationId: "btm-layout",
    customerName: "Priya Das",
    customerGender: "female",
    customerAvatarId: null,
    items: [
      { name: "Tiramisu Sundae", category: "Sundaes", qty: 1, price: 329 },
      { name: "Oreo Milkshake", category: "Milkshakes", qty: 1, price: 189 },
    ],
    mode: "delivery",
    paymentMethod: "card",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "o4",
    billNo: "CZT-1041",
    locationId: "koramangala",
    customerName: "Kabir Verma",
    customerGender: "male",
    customerAvatarId: null,
    items: [{ name: "Gudbud", category: "Sundaes", qty: 3, price: 299 }],
    mode: "dinein",
    paymentMethod: "upi",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

const RANDOM_CUSTOMERS: { name: string; gender: CustomerGender }[] = [
  { name: "Sneha Rao", gender: "female" },
  { name: "Arjun Iyer", gender: "male" },
  { name: "Fatima Khan", gender: "female" },
  { name: "Vikram Singh", gender: "male" },
  { name: "Meera Nair", gender: "female" },
];
const RANDOM_ITEMS: OrderItem[] = [
  { name: "Death By Chocolate", category: "Sundaes", qty: 1, price: 349 },
  { name: "Lotus Biscoff Cake Can", category: "Cake Cans", qty: 1, price: 289 },
  { name: "Fudge Walnut Brownie", category: "Brownies", qty: 2, price: 149 },
  { name: "Signature Cold Brew", category: "Coffee", qty: 1, price: 169 },
];
const RANDOM_MODES: OrderMode[] = ["pickup", "dinein", "delivery"];
const RANDOM_PAYMENTS: PaymentMethod[] = ["cash", "upi", "card"];

export function generateRandomOrder(locationId: string): Order {
  const customer = RANDOM_CUSTOMERS[Math.floor(Math.random() * RANDOM_CUSTOMERS.length)];
  const item = RANDOM_ITEMS[Math.floor(Math.random() * RANDOM_ITEMS.length)];
  const mode = RANDOM_MODES[Math.floor(Math.random() * RANDOM_MODES.length)];
  const paymentMethod = RANDOM_PAYMENTS[Math.floor(Math.random() * RANDOM_PAYMENTS.length)];
  return {
    id: `o${Date.now()}`,
    billNo: generateBillNo(),
    locationId,
    customerName: customer.name,
    customerGender: customer.gender,
    customerAvatarId: null,
    items: [item],
    mode,
    paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// Stats helpers — used by the Today's Sales and Leaderboard cards
// ============================================

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function getTodaysOrders(orders: Order[]): Order[] {
  return orders
    .filter((o) => isToday(o.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTodaysRevenue(orders: Order[]): number {
  return getTodaysOrders(orders).reduce((sum, o) => sum + orderTotal(o), 0);
}

export function getTodaysOrderCount(orders: Order[]): number {
  return getTodaysOrders(orders).length;
}

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function getThisMonthsOrders(orders: Order[]): Order[] {
  return orders
    .filter((o) => isThisMonth(o.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Matches an order's createdAt against any specific calendar date —
// used by the sales calendar to show orders for a picked day.
export function isSameDate(dateStr: string, target: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

export function getOrdersForDate(orders: Order[], target: Date): Order[] {
  return orders
    .filter((o) => isSameDate(o.createdAt, target))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export type LeaderboardEntry = {
  name: string;
  qty: number;
  revenue: number;
};

export function getLeaderboard(orders: Order[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.name);
      if (existing) {
        existing.qty += item.qty;
        existing.revenue += item.qty * item.price;
      } else {
        map.set(item.name, { name: item.name, qty: item.qty, revenue: item.qty * item.price });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
}

// ============================================
// Crown Leaderboard — customers ranked by crowns earned this month.
// Crowns = 20% of total spend, rounded to nearest whole crown.
// ============================================

export type CrownLeaderboardEntry = {
  name: string;
  gender: CustomerGender;
  avatarId: string | null;
  totalSpent: number;
  crowns: number;
};

export function getCrownLeaderboard(orders: Order[]): CrownLeaderboardEntry[] {
  const map = new Map<string, CrownLeaderboardEntry>();
  for (const order of orders) {
    const key = order.customerName;
    const spent = orderTotal(order);
    const existing = map.get(key);
    if (existing) {
      existing.totalSpent += spent;
    } else {
      map.set(key, {
        name: order.customerName,
        gender: order.customerGender ?? "male",
        avatarId: order.customerAvatarId ?? null,
        totalSpent: spent,
        crowns: 0,
      });
    }
  }
  const list = Array.from(map.values());
  for (const entry of list) {
    entry.crowns = Math.round(entry.totalSpent * 0.2);
  }
  return list.sort((a, b) => b.crowns - a.crowns);
}