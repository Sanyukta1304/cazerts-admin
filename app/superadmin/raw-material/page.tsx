"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Send, X } from "lucide-react";
import {
  addMaterial,
  fmtDateTime,
  getMaterials,
  getRequests,
  RawMaterial,
  RawRequest,
  removeMaterial,
  sendRequest,
  STATUS_UI,
} from "@/lib/rawMaterial";

const inputCls =
  "rounded-2xl border border-black/10 bg-[var(--color-cream)] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20";

export default function SuperAdminRawMaterialPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [requests, setRequests] = useState<RawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "requested" | "in_transit" | "received">("all");

  const load = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([getMaterials(), getRequests()]);
      setMaterials(m);
      setRequests(r);
      setError("");
    } catch {
      setError("Couldn't load. Did you run the SQL in Supabase?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000); // live refresh
    return () => clearInterval(t);
  }, [load]);

  async function handleAdd() {
    if (name.trim().length < 2) return setError("Enter the item name.");
    setAdding(true);
    setError("");
    try {
      await addMaterial(name, unit);
      setName("");
      await load();
    } catch {
      setError("Couldn't add the item.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Couldn't remove the item.");
    }
  }

  async function handleSend(r: RawRequest) {
    setBusyId(r.id);
    setError("");
    try {
      const { sentAt, expectedBy } = await sendRequest(r);
      setRequests((prev) =>
        prev.map((x) =>
          x.id === r.id ? { ...x, status: "in_transit", sentAt, expectedBy } : x
        )
      );
    } catch {
      setError("Couldn't send. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const shown = requests.filter((r) => filter === "all" || r.status === filter);
  const pending = requests.filter((r) => r.status === "requested").length;

  return (
    <main className="px-5 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
          CAZERTS Super Admin
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Raw material
        </h1>
        <p className="mt-2 max-w-xl text-sm text-black/45 md:text-base">
          Add the items stores can request, and send stock when a store runs out.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Items */}
        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-display text-lg font-extrabold">Items stores can request</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {materials.length === 0 && !loading && (
              <p className="text-sm text-black/40">No items yet. Add your first one below.</p>
            )}
            {materials.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] py-2 pl-4 pr-2 text-sm font-semibold"
              >
                {m.name}
                <span className="text-xs text-black/40">({m.unit})</span>
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black/40 hover:bg-black/10 hover:text-black"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chocolate, Vanilla"
              className={`${inputCls} flex-1`}
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              <option value="kg">kg</option>
              <option value="L">litre</option>
              <option value="pcs">pcs</option>
              <option value="packs">packs</option>
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-magenta)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--color-magenta)]/30 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add item
            </button>
          </div>
        </section>

        {/* Requests table */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold">
              Store requests
              {pending > 0 && (
                <span className="ml-3 rounded-full bg-amber-50 px-2.5 py-1 align-middle text-xs font-bold text-amber-600">
                  {pending} waiting
                </span>
              )}
            </h2>

            <div className="flex flex-wrap gap-2">
              {(["all", "requested", "in_transit", "received"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    filter === f
                      ? "bg-[var(--color-magenta)] text-white"
                      : "bg-white text-black/55 hover:bg-black/5"
                  }`}
                >
                  {f === "all" ? "All" : STATUS_UI[f].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-black/10 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                  <th className="px-5 py-4">Store</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Requested</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-black/40">
                      Loading...
                    </td>
                  </tr>
                ) : shown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-black/40">
                      No requests here yet.
                    </td>
                  </tr>
                ) : (
                  shown.map((r) => {
                    const st = STATUS_UI[r.status];
                    return (
                      <tr key={r.id} className="border-b border-black/5 last:border-0">
                        <td className="px-5 py-4 font-bold">{r.storeName}</td>
                        <td className="px-5 py-4">{r.materialName}</td>
                        <td className="px-5 py-4 font-semibold">
                          {r.quantity} {r.unit}
                        </td>
                        <td className="px-5 py-4 text-black/50">{fmtDateTime(r.requestedAt)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {r.status === "requested" && (
                            <button
                              type="button"
                              onClick={() => handleSend(r)}
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-magenta)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {busyId === r.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                              Send
                            </button>
                          )}
                          {r.status === "in_transit" && (
                            <span className="text-xs text-black/45">
                              Expected by {fmtDateTime(r.expectedBy)}
                            </span>
                          )}
                          {r.status === "received" && (
                            <span className="text-xs text-green-600">
                              Received {fmtDateTime(r.receivedAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}