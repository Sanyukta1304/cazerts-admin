"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronRight, Loader2, PackageCheck, X } from "lucide-react";
import {
  createRequest,
  fmtDateTime,
  getMaterials,
  getNotifications,
  getRequests,
  markNotificationsRead,
  RawMaterial,
  RawRequest,
  receiveRequest,
  StoreNotification,
  STATUS_UI,
} from "@/lib/rawMaterial";

export default function StoreRawMaterialPage() {
  const params = useParams<{ location: string }>();
  const storeId = params.location;

  const storeName = decodeURIComponent(storeId ?? "")
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [requests, setRequests] = useState<RawRequest[]>([]);
  const [notes, setNotes] = useState<StoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<RawMaterial | null>(null);
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, r, n] = await Promise.all([
        getMaterials(),
        getRequests(storeId),
        getNotifications(storeId),
      ]);
      setMaterials(m);
      setRequests(r);
      setNotes(n);
      setError("");
    } catch {
      setError("Couldn't load. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000); // live refresh
    return () => clearInterval(t);
  }, [load]);

  const unread = notes.filter((n) => !n.read).length;

  async function toggleNotes() {
    const next = !showNotes;
    setShowNotes(next);
    if (next && unread > 0) {
      await markNotificationsRead(storeId);
      setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function handleRequest() {
    const q = parseFloat(qty);
    if (!selected) return;
    if (!Number.isFinite(q) || q <= 0) return setError("Enter how much you need.");

    setSaving(true);
    setError("");
    try {
      await createRequest({ storeId, storeName, material: selected, quantity: q });
      setSelected(null);
      setQty("");
      await load();
    } catch {
      setError("Couldn't send the request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReceived(r: RawRequest) {
    setBusyId(r.id);
    setError("");
    try {
      const receivedAt = await receiveRequest(r.id);
      setRequests((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, status: "received", receivedAt } : x))
      );
    } catch {
      setError("Couldn't update. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      <header className="flex items-center justify-between px-8 pt-7 md:px-12">
        <Link
          href={`/cazerts/${storeId}/dashboard`}
          className="group flex items-center gap-2 text-sm text-black/45 transition-colors hover:text-black"
        >
          <ChevronRight
            size={16}
            className="rotate-180 transition-transform group-hover:-translate-x-0.5"
          />
          Back to dashboard
        </Link>

        {/* Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotes}
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <Bell size={19} className="text-black/60" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-magenta)] px-1 text-[11px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {showNotes && (
            <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl bg-white p-3 shadow-xl">
              <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-black/35">
                Notifications
              </p>
              {notes.length === 0 ? (
                <p className="px-2 py-4 text-sm text-black/40">Nothing yet.</p>
              ) : (
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-[var(--color-cream)]">
                      <p className="text-sm font-semibold">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-black/35">{fmtDateTime(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 pb-12 pt-12 md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
          Cazerts Admin · {storeName}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Raw material
        </h1>
        <p className="mt-3 text-base text-black/45">
          Running low? Tap an item and tell us how much you need.
        </p>

        {error && !selected && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Square boxes */}
        <section className="mt-8">
          {loading ? (
            <p className="text-sm text-black/40">Loading...</p>
          ) : materials.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/15 bg-white px-5 py-8 text-center text-sm text-black/40">
              No items yet. The super admin will add them here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {materials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelected(m);
                    setQty("");
                    setError("");
                  }}
                  className="group flex aspect-square flex-col items-center justify-center rounded-3xl bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-cream)] font-display text-2xl font-extrabold text-black/50 transition-colors group-hover:bg-[var(--color-magenta)]/10 group-hover:text-[var(--color-magenta)]">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="mt-3 text-center font-display text-sm font-bold">{m.name}</p>
                  <p className="mt-0.5 text-xs text-black/40">Request ({m.unit})</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* My requests */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold">My requests</h2>

          {requests.length === 0 ? (
            <p className="mt-4 text-sm text-black/40">You haven't requested anything yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {requests.map((r) => {
                const st = STATUS_UI[r.status];
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display text-base font-extrabold">
                        {r.materialName} · {r.quantity} {r.unit}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        Requested {fmtDateTime(r.requestedAt)}
                        {r.status === "in_transit" && ` · Expected by ${fmtDateTime(r.expectedBy)}`}
                        {r.status === "received" && ` · Received ${fmtDateTime(r.receivedAt)}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                      {r.status === "in_transit" && (
                        <button
                          type="button"
                          onClick={() => handleReceived(r)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          {busyId === r.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <PackageCheck size={14} />
                          )}
                          Mark as received
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Request popup */}
      {selected && (
        <div
          onClick={() => !saving && setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-extrabold">
                  Request {selected.name}
                </h3>
                <p className="mt-1 text-sm text-black/45">How much do you need?</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cancel"
                className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <input
                type="number"
                min="0"
                autoFocus
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-2xl border border-black/15 px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--color-magenta)]"
              />
              <span className="text-sm font-semibold text-black/50">{selected.unit}</span>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={saving}
                className="flex-1 rounded-full bg-black/5 py-3 text-sm font-bold text-black/60 hover:bg-black/10 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequest}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-magenta)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}