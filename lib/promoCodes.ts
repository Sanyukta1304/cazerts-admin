"use client";

import { supabase } from "./supabase";

export type PromoCode = {
  id: string;
  code: string;
  eventName: string;
  discountType: "percent" | "flat";
  discountValue: number;
  audience: "all" | "specific";
  phones: string[];
  validFrom: string | null; // "YYYY-MM-DD"
  validTo: string | null;
  minOrder: number;
  maxDiscount: number | null;
  oncePerCustomer: boolean;
  active: boolean;
  createdAt: string;
};

export type NewPromoCode = Omit<PromoCode, "id" | "createdAt" | "active">;

// Keeps the last 10 digits so "+91 98765 43210" and "9876543210" match.
export function normalizePhone(p: string): string {
  return p.replace(/\D/g, "").slice(-10);
}

function fromRow(r: any): PromoCode {
  return {
    id: r.id,
    code: r.code,
    eventName: r.event_name ?? "",
    discountType: r.discount_type,
    discountValue: Number(r.discount_value),
    audience: r.audience,
    phones: r.phones ?? [],
    validFrom: r.valid_from ?? null,
    validTo: r.valid_to ?? null,
    minOrder: Number(r.min_order) || 0,
    maxDiscount: r.max_discount === null ? null : Number(r.max_discount),
    oncePerCustomer: !!r.once_per_customer,
    active: !!r.active,
    createdAt: r.created_at,
  };
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading promo codes:", error);
    throw error;
  }
  return (data ?? []).map(fromRow);
}

export async function createPromoCode(input: NewPromoCode): Promise<PromoCode> {
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      event_name: input.eventName.trim() || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      audience: input.audience,
      phones: input.audience === "specific" ? input.phones.map(normalizePhone) : [],
      valid_from: input.validFrom,
      valid_to: input.validTo,
      min_order: input.minOrder,
      max_discount: input.discountType === "percent" ? input.maxDiscount : null,
      once_per_customer: input.oncePerCustomer,
      active: true,
    })
    .select()
    .single();

  if (error) {
    if ((error as any).code === "23505") {
      throw new Error("That code already exists. Pick a different one.");
    }
    console.error("Error creating promo code:", error);
    throw error;
  }
  return fromRow(data);
}

export async function setPromoActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("promo_codes").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) throw error;
}