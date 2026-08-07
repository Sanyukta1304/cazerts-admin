"use client";

import { supabase } from "./supabase";

export type AdminReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
};

export async function getAllReviews(): Promise<AdminReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, rating, text, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    text: r.text,
    createdAt: r.created_at,
  }));
}

export type AdminSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

export async function getAllSubscribers(): Promise<AdminSubscriber[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscribers:", error);
    throw error;
  }

  return (data ?? []).map((s: any) => ({
    id: s.id,
    email: s.email,
    createdAt: s.created_at,
  }));
}

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export async function getAllContactMessages(): Promise<AdminContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contact messages:", error);
    throw error;
  }

  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    message: m.message,
    createdAt: m.created_at,
  }));
}