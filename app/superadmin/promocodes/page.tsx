"use client";

import { useEffect, useState } from "react";
import {
  Dices,
  Loader2,
  Plus,
  Ticket,
  Trash2,
  User,
  Users,
} from "lucide-react";
import {
  createPromoCode,
  deletePromoCode,
  getPromoCodes,
  normalizePhone,
  PromoCode,
  setPromoActive,
} from "@/lib/promoCodes";
import { todayIST } from "@/lib/superadminSales";

const EMPTY = {
  code: "",
  eventName: "",
  discountType: "percent" as "percent" | "flat",
  discountValue: "",
  audience: "all" as "all" | "specific",
  phones: "",
  validFrom: "",
  validTo: "",
  minOrder: "",
  maxDiscount: "",
  oncePerCustomer: true,
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "CAZ";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusOf(p: PromoCode, today: string) {
  if (!p.active) return { label: "Off", cls: "bg-black/5 text-black/45" };
  if (p.validTo && today > p.validTo)
    return { label: "Expired", cls: "bg-red-50 text-red-500" };
  if (p.validFrom && today < p.validFrom)
    return { label: "Scheduled", cls: "bg-amber-50 text-amber-600" };
  return { label: "Active", cls: "bg-green-50 text-green-600" };
}

const inputCls =
  "mt-1.5 w-full rounded-2xl border border-black/10 bg-[var(--color-cream)] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-black/40";

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const today = todayIST();

  async function load() {
    setLoading(true);
    try {
      setCodes(await getPromoCodes());
    } catch {
      setError("Couldn't load promo codes. Did you run the SQL in Supabase?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate() {
    setError("");

    const code = form.code.trim().toUpperCase();
    const value = parseFloat(form.discountValue);
    const phones = Array.from(
      new Set(
        form.phones
          .split(/[\s,;]+/)
          .map(normalizePhone)
          .filter(Boolean)
      )
    );

    if (code.length < 3) return setError("Enter a code (at least 3 characters).");
    if (!/^[A-Z0-9_-]+$/.test(code))
      return setError("Codes can only have letters, numbers, - and _.");
    if (!Number.isFinite(value) || value <= 0)
      return setError("Enter a valid discount.");
    if (form.discountType === "percent" && value > 100)
      return setError("A percentage can't be more than 100.");
    if (form.audience === "specific") {
      if (phones.length === 0)
        return setError("Add at least one customer phone number.");
      if (phones.some((p) => p.length !== 10))
        return setError("Phone numbers must be 10 digits each.");
    }
    if (form.validFrom && form.validTo && form.validFrom > form.validTo)
      return setError("'Valid to' can't be before 'Valid from'.");

    setSaving(true);
    try {
      const created = await createPromoCode({
        code,
        eventName: form.eventName,
        discountType: form.discountType,
        discountValue: value,
        audience: form.audience,
        phones,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        minOrder: parseFloat(form.minOrder) || 0,
        maxDiscount: parseFloat(form.maxDiscount) || null,
        oncePerCustomer: form.oncePerCustomer,
      });
      setCodes((prev) => [created, ...prev]);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message || "Couldn't create the code. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: PromoCode) {
    setBusyId(p.id);
    try {
      await setPromoActive(p.id, !p.active);
      setCodes((prev) =>
        prev.map((c) => (c.id === p.id ? { ...c, active: !p.active } : c))
      );
    } catch {
      setError("Couldn't update that code.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deletePromoCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Couldn't delete that code.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <main className="px-5 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
          CAZERTS Super Admin
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Promo codes
        </h1>
        <p className="mt-2 max-w-xl text-sm text-black/45 md:text-base">
          Create a code for everyone or for specific customers, for a day or an
          event. Share it with them and they can use it at checkout.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Create form */}
        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-magenta)]/10">
              <Ticket size={17} className="text-[var(--color-magenta)]" />
            </div>
            <h2 className="font-display text-lg font-extrabold">New promo code</h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Code */}
            <label className="block">
              <span className={labelCls}>Code</span>
              <div className="relative">
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI25"
                  maxLength={20}
                  className={`${inputCls} pr-12 uppercase`}
                />
                <button
                  type="button"
                  onClick={() => set("code", randomCode())}
                  aria-label="Generate a code"
                  title="Generate a code"
                  className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-black/35 hover:text-[var(--color-magenta)]"
                >
                  <Dices size={18} />
                </button>
              </div>
            </label>

            {/* Event */}
            <label className="block">
              <span className={labelCls}>Event / occasion (optional)</span>
              <input
                value={form.eventName}
                onChange={(e) => set("eventName", e.target.value)}
                placeholder="e.g. Diwali, Birthday treat"
                className={inputCls}
              />
            </label>

            {/* Discount */}
            <div>
              <span className={labelCls}>Discount</span>
              <div className="mt-1.5 flex gap-2">
                <div className="inline-flex rounded-2xl border border-black/10 bg-[var(--color-cream)] p-1">
                  {(["percent", "flat"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("discountType", t)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        form.discountType === t
                          ? "bg-[var(--color-magenta)] text-white"
                          : "text-black/50"
                      }`}
                    >
                      {t === "percent" ? "%" : "₹"}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)}
                  placeholder={form.discountType === "percent" ? "10" : "100"}
                  className="w-full rounded-2xl border border-black/10 bg-[var(--color-cream)] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20"
                />
              </div>
            </div>

            {/* Who */}
            <div>
              <span className={labelCls}>Who can use it</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    { k: "all", label: "All customers", icon: Users },
                    { k: "specific", label: "Specific people", icon: User },
                  ] as const
                ).map(({ k, label, icon: Icon }) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("audience", k)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-semibold transition ${
                      form.audience === k
                        ? "border-[var(--color-magenta)] bg-[var(--color-magenta)]/5 text-[var(--color-magenta)]"
                        : "border-black/10 text-black/55"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.audience === "specific" && (
              <label className="block md:col-span-2">
                <span className={labelCls}>
                  Customer phone numbers (comma or new line separated)
                </span>
                <textarea
                  value={form.phones}
                  onChange={(e) => set("phones", e.target.value)}
                  rows={3}
                  placeholder={"9876543210\n9123456780"}
                  className={`${inputCls} resize-none`}
                />
              </label>
            )}

            {/* Dates */}
            <label className="block">
              <span className={labelCls}>Valid from (optional)</span>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Valid to (optional)</span>
              <input
                type="date"
                value={form.validTo}
                min={form.validFrom || undefined}
                onChange={(e) => set("validTo", e.target.value)}
                className={inputCls}
              />
            </label>

            {/* Limits */}
            <label className="block">
              <span className={labelCls}>Minimum order ₹ (optional)</span>
              <input
                type="number"
                min="0"
                value={form.minOrder}
                onChange={(e) => set("minOrder", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </label>
            {form.discountType === "percent" && (
              <label className="block">
                <span className={labelCls}>Max discount ₹ (optional)</span>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => set("maxDiscount", e.target.value)}
                  placeholder="e.g. 200"
                  className={inputCls}
                />
              </label>
            )}
          </div>

          <label className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-black/65">
            <input
              type="checkbox"
              checked={form.oncePerCustomer}
              onChange={(e) => set("oncePerCustomer", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-magenta)]"
            />
            Each customer can use it only once
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-magenta)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--color-magenta)]/30 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create code
          </button>
        </section>

        {/* List */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-extrabold">Your codes</h2>

          {loading ? (
            <p className="mt-4 text-sm text-black/40">Loading...</p>
          ) : codes.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-black/15 bg-white px-5 py-8 text-center text-sm text-black/40">
              No promo codes yet. Create your first one above.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {codes.map((p) => {
                const st = statusOf(p, today);
                const busy = busyId === p.id;

                return (
                  <div
                    key={p.id}
                    className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-xl font-extrabold tracking-wide">
                          {p.code}
                        </p>
                        {p.eventName && (
                          <p className="mt-0.5 text-xs text-black/40">{p.eventName}</p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    <p className="mt-3 text-2xl font-extrabold text-[var(--color-magenta)]">
                      {p.discountType === "percent"
                        ? `${p.discountValue}% off`
                        : `₹${p.discountValue} off`}
                    </p>

                    <ul className="mt-3 space-y-1 text-xs text-black/50">
                      <li>
                        {p.audience === "all"
                          ? "For all customers"
                          : `For ${p.phones.length} specific customer${
                              p.phones.length !== 1 ? "s" : ""
                            }: ${p.phones.join(", ")}`}
                      </li>
                      <li>
                        {p.validFrom || p.validTo
                          ? `Valid ${p.validFrom ? fmtDate(p.validFrom) : "any time"} – ${
                              p.validTo ? fmtDate(p.validTo) : "no end"
                            }`
                          : "No date limit"}
                      </li>
                      {p.minOrder > 0 && <li>Minimum order ₹{p.minOrder}</li>}
                      {p.maxDiscount && <li>Max discount ₹{p.maxDiscount}</li>}
                      <li>
                        {p.oncePerCustomer ? "One use per customer" : "Unlimited uses"}
                      </li>
                    </ul>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(p)}
                        disabled={busy}
                        className="rounded-full bg-black/5 px-4 py-2 text-xs font-bold text-black/65 transition hover:bg-black/10 disabled:opacity-50"
                      >
                        {p.active ? "Turn off" : "Turn on"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.id)}
                        disabled={busy}
                        aria-label={`Delete ${p.code}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>

                    {confirmDeleteId === p.id && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 p-5 text-center">
                        <p className="text-sm font-bold">Delete {p.code}?</p>
                        <p className="mt-1 text-xs text-black/50">
                          This can't be undone.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full bg-black/5 px-4 py-2 text-xs font-semibold hover:bg-black/10"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(p.id)}
                            className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}