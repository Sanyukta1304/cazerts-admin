import { supabase } from "@/lib/supabase";

export type RawMaterial = { id: string; name: string; unit: string };
export type RequestStatus = "requested" | "in_transit" | "received";

export type RawRequest = {
  id: string;
  storeId: string;
  storeName: string;
  materialName: string;
  unit: string;
  quantity: number;
  status: RequestStatus;
  requestedAt: string;
  sentAt: string | null;
  expectedBy: string | null;
  receivedAt: string | null;
};

export type StoreNotification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function toRequest(r: any): RawRequest {
  return {
    id: r.id,
    storeId: r.store_id,
    storeName: r.store_name,
    materialName: r.material_name,
    unit: r.unit,
    quantity: Number(r.quantity),
    status: r.status,
    requestedAt: r.requested_at,
    sentAt: r.sent_at,
    expectedBy: r.expected_by,
    receivedAt: r.received_at,
  };
}

/* ---------- Items (superadmin adds these) ---------- */

export async function getMaterials(): Promise<RawMaterial[]> {
  const { data, error } = await supabase
    .from("raw_materials")
    .select("id, name, unit")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMaterial(name: string, unit: string) {
  const { error } = await supabase
    .from("raw_materials")
    .insert({ name: name.trim(), unit });
  if (error) throw error;
}

export async function removeMaterial(id: string) {
  const { error } = await supabase
    .from("raw_materials")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Requests ---------- */

export async function createRequest(input: {
  storeId: string;
  storeName: string;
  material: RawMaterial;
  quantity: number;
}) {
  const { error } = await supabase.from("raw_material_requests").insert({
    store_id: input.storeId,
    store_name: input.storeName,
    material_id: input.material.id,
    material_name: input.material.name,
    unit: input.material.unit,
    quantity: input.quantity,
  });
  if (error) throw error;
}

// storeId given = one store (store admin). No storeId = all stores (superadmin).
export async function getRequests(storeId?: string): Promise<RawRequest[]> {
  let q = supabase
    .from("raw_material_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toRequest);
}

// Superadmin presses "Send"
export async function sendRequest(req: RawRequest) {
  const sentAt = new Date();
  const expectedBy = new Date(sentAt.getTime() + 48 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("raw_material_requests")
    .update({
      status: "in_transit",
      sent_at: sentAt.toISOString(),
      expected_by: expectedBy.toISOString(),
    })
    .eq("id", req.id)
    .eq("status", "requested");
  if (error) throw error;

  await supabase.from("store_notifications").insert({
    store_id: req.storeId,
    message: `${req.quantity} ${req.unit} of ${req.materialName} is on the way. Expected within 48 hours.`,
  });

  return { sentAt: sentAt.toISOString(), expectedBy: expectedBy.toISOString() };
}

// Store admin presses "Mark as received"
export async function receiveRequest(id: string) {
  const receivedAt = new Date().toISOString();
  const { error } = await supabase
    .from("raw_material_requests")
    .update({ status: "received", received_at: receivedAt })
    .eq("id", id)
    .eq("status", "in_transit");
  if (error) throw error;
  return receivedAt;
}

/* ---------- Notifications (store side) ---------- */

export async function getNotifications(storeId: string): Promise<StoreNotification[]> {
  const { data, error } = await supabase
    .from("store_notifications")
    .select("id, message, read, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((n: any) => ({
    id: n.id,
    message: n.message,
    read: n.read,
    createdAt: n.created_at,
  }));
}

export async function markNotificationsRead(storeId: string) {
  await supabase
    .from("store_notifications")
    .update({ read: true })
    .eq("store_id", storeId)
    .eq("read", false);
}

/* ---------- Shared display helpers ---------- */

export const STATUS_UI: Record<RequestStatus, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-amber-50 text-amber-600" },
  in_transit: { label: "In transit", cls: "bg-blue-50 text-blue-600" },
  received: { label: "Received", cls: "bg-green-50 text-green-600" },
};

export function fmtDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}