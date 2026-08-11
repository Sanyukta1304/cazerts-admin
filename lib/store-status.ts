"use client";

import { supabase } from "./supabase";

// Store is scheduled to be open 2:00 PM – 11:59 PM every day, IST.
const OPEN_HOUR = 14; // 2:00 PM
const CLOSE_HOUR = 24; // midnight (i.e. up to 11:59:59 PM)
const TIMEZONE = "Asia/Kolkata";

export type StoreStatus = {
  locationId: string;
  isOpen: boolean; // the final answer: can customers order right now?
  withinScheduledHours: boolean; // true if it's currently 2pm–11:59pm IST
  manuallyClosed: boolean; // true if admin pressed "off" AND that override is still for today
  manuallyOpened: boolean; // true if admin forced "on" outside scheduled hours AND that override is still for today
};

function getIstHour(): number {
  const istString = new Date().toLocaleString("en-US", { timeZone: TIMEZONE, hour12: false });
  return new Date(istString).getHours();
}

function getIstDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function isWithinScheduledHours(): boolean {
  const hour = getIstHour();
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

export async function getStoreStatus(locationId: string): Promise<StoreStatus> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("manual_closed, manual_closed_date, manual_open, manual_open_date")
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching store status:", error);
    throw error;
  }

  const today = getIstDateString();
  const manuallyClosed = !!data?.manual_closed && data?.manual_closed_date === today;
  const manuallyOpened = !!data?.manual_open && data?.manual_open_date === today;
  const withinScheduledHours = isWithinScheduledHours();

  return {
    locationId,
    withinScheduledHours,
    manuallyClosed,
    manuallyOpened,
    // Manual "closed" always wins. Otherwise, either the schedule or a
    // manual "force open" override lets the store take orders.
    isOpen: !manuallyClosed && (withinScheduledHours || manuallyOpened),
  };
}

// Admin presses the "off" toggle: closes the store for the REST OF TODAY
// only. Turning it back on clears both overrides so the schedule takes
// over again.
export async function setManualClosed(locationId: string, closed: boolean): Promise<void> {
  const today = getIstDateString();
  const { error } = await supabase.from("store_settings").upsert(
    {
      location_id: locationId,
      manual_closed: closed,
      manual_closed_date: closed ? today : null,
      ...(closed ? { manual_open: false, manual_open_date: null } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "location_id" }
  );

  if (error) {
    console.error("Error updating store status:", error);
    throw error;
  }
}

// Admin presses "Open Now": forces the store open for the REST OF TODAY
// even outside the 2pm–11:59pm schedule.
export async function setManualOpen(locationId: string, opened: boolean): Promise<void> {
  const today = getIstDateString();
  const { error } = await supabase.from("store_settings").upsert(
    {
      location_id: locationId,
      manual_open: opened,
      manual_open_date: opened ? today : null,
      ...(opened ? { manual_closed: false, manual_closed_date: null } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "location_id" }
  );

  if (error) {
    console.error("Error updating store status:", error);
    throw error;
  }
}