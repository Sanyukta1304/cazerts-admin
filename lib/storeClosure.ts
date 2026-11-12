"use client";

import { supabase } from "./supabase";
import { endOfTodayIST, StoreOverride } from "./store-hours";

// Reads the admin's override for a store. No row yet = no override,
// so the normal opening hours apply.
export async function getStoreClosure(locationId: string): Promise<StoreOverride> {
  const { data, error } = await supabase
    .from("store_closures")
    .select("is_closed, reason, force_open_until")
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) {
    console.error("Error reading store status:", error);
    throw error;
  }

  return {
    isClosed: data?.is_closed ?? false,
    reason: data?.reason ?? "",
    forceOpenUntil: data?.force_open_until ?? null,
  };
}

// Admin closes the store, with a reason customers will see.
export async function closeStore(locationId: string, reason: string): Promise<void> {
  const { error } = await supabase.from("store_closures").upsert(
    {
      location_id: locationId,
      is_closed: true,
      reason: reason.trim(),
      force_open_until: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "location_id" }
  );

  if (error) {
    console.error("Error closing store:", error);
    throw error;
  }
}

// Admin opens the store now, even before 2:00 PM. It stays open until
// 12:00 AM, then the normal hours take over again. Returns that end time.
export async function openStoreNow(locationId: string): Promise<string> {
  const until = endOfTodayIST().toISOString();

  const { error } = await supabase.from("store_closures").upsert(
    {
      location_id: locationId,
      is_closed: false,
      reason: null,
      force_open_until: until,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "location_id" }
  );

  if (error) {
    console.error("Error opening store:", error);
    throw error;
  }

  return until;
}