"use client";

import { supabase } from "./supabase";
import { Order, OrderStatus, CustomerGender, PaymentMethod, OrderItem } from "./orders";

// Location codes used in bill numbers: CZT-01-001, CZT-02-001, etc.
const LOCATION_CODES: Record<string, string> = {
  "btm-layout": "01",
  indiranagar: "02",
  koramangala: "03",
};

function getLocationCode(locationId: string): string {
  return LOCATION_CODES[locationId] ?? "00";
}

// Maps a raw Supabase row (with joined customers + order_items) into
// the app's Order shape.
function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    billNo: row.bill_no || `CZT-${getLocationCode(row.location_id)}-${row.id.slice(0, 4).toUpperCase()}`,
    locationId: row.location_id,
    customerName: row.customers?.name ?? "Walk-in",
    customerGender: (row.customers?.gender as CustomerGender) ?? "male",
    customerAvatarId: row.customers?.avatar_id ?? null,
    items: (row.order_items ?? []).map(
      (i: any): OrderItem => ({
        name: i.product_name,
        category: i.category ?? "",
        qty: i.quantity,
        price: i.price,
      })
    ),
    mode: row.order_mode,
    paymentMethod: row.payment_method as PaymentMethod,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
  };
}

export async function getOrders(locationId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name, gender, avatar_id), order_items(*)")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data ?? []).map(mapRowToOrder);
}

async function generateUniqueBillNo(locationId: string): Promise<string> {
  const code = getLocationCode(locationId);

  const { data, error } = await supabase
    .from("orders")
    .select("bill_no")
    .eq("location_id", locationId)
    .not("bill_no", "is", null);

  if (error) {
    console.error("Error generating bill number:", error);
    return `CZT-${code}-${Date.now()}`;
  }

  let max = 0;
  const pattern = new RegExp(`^CZT-${code}-(\\d+)$`);
  for (const row of data ?? []) {
    const match = pattern.exec(row.bill_no ?? "");
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  const next = max + 1;
  return `CZT-${code}-${String(next).padStart(3, "0")}`;
}

async function findOrCreateCustomerByName(
  name: string,
  gender: CustomerGender
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("id")
    .eq("name", name)
    .is("phone", null)
    .maybeSingle();

  if (findError) {
    console.error("Error finding counter customer:", findError);
  }

  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("customers")
    .insert({ name, gender })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating counter customer:", createError);
    throw createError;
  }

  return created.id;
}

// Adds a new order (used by counter/pickup orders taken by staff).
// Creates the order + order_items rows in Supabase, assigns a unique
// bill number, and returns the final saved Order.
export async function addOrder(
  locationId: string,
  customerName: string,
  customerGender: CustomerGender,
  items: OrderItem[],
  mode: Order["mode"],
  paymentMethod: PaymentMethod
): Promise<Order> {
  const customerId = await findOrCreateCustomerByName(customerName, customerGender);
  const billNo = await generateUniqueBillNo(locationId);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "pending",
      total,
      location_id: locationId,
      order_mode: mode,
      payment_method: paymentMethod,
      bill_no: billNo,
    })
    .select("id, created_at")
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError;
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_name: item.name,
    category: item.category,
    quantity: item.qty,
    price: item.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    throw itemsError;
  }

  return {
    id: order.id,
    billNo,
    locationId,
    customerName,
    customerGender,
    customerAvatarId: null,
    items,
    mode,
    paymentMethod,
    status: "pending",
    createdAt: order.created_at,
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function createCounterOrder(
  locationId: string,
  customerName: string,
  items: OrderItem[],
  paymentMethod: PaymentMethod = "cash",
  customerGender: CustomerGender = "male"
): Promise<Order> {
  return addOrder(locationId, customerName, customerGender, items, "pickup", paymentMethod);
}