"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Power, Clock } from "lucide-react";
import { getLocationById } from "@/lib/locations";
import { getStoreStatus, setManualClosed, StoreStatus } from "@/lib/store-status";

export default function StoreStatusPage() {
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await getStoreStatus(locationId);
      setStatus(data);
    } catch {
      setError("Couldn't load store status. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresh every minute so the "within scheduled hours" state stays
    // accurate even if the admin leaves this page open past 2pm/midnight.
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [locationId]);

  async function handleToggle() {
    if (!status) return;
    setUpdating(true);
    setError("");
    try {
      await setManualClosed(locationId, !status.manuallyClosed);
      await load();
    } catch {
      setError("Failed to update store status. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12">
      <div className="max-w-xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          {location ? location.name : "CAZERTS"}
        </p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2">Store Status</h1>
        <p className="text-black/50 text-sm mb-8">
          Open automatically 2:00 PM – 11:59 PM every day. Use the switch below to close early —
          it turns back on by itself the next day.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {loading || !status ? (
          <p className="text-black/40 text-sm">Loading...</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
                status.isOpen ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}
            >
              <Power size={32} />
            </div>

            <p className="font-display font-extrabold text-2xl mb-1">
              {status.isOpen ? "Currently Open" : "Currently Closed"}
            </p>
            <p className="text-black/50 text-sm mb-8">
              {status.manuallyClosed
                ? "Closed manually for the rest of today"
                : status.withinScheduledHours
                ? "Within scheduled hours (2 PM – 11:59 PM)"
                : "Outside scheduled hours"}
            </p>

            <button
              onClick={handleToggle}
              disabled={updating}
              className={`w-full py-4 rounded-full font-bold transition disabled:opacity-50 ${
                status.manuallyClosed
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {updating
                ? "Updating..."
                : status.manuallyClosed
                ? "Turn Store Back On"
                : "Close Store For Today"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-black/40 mt-6">
              <Clock size={13} />
              Scheduled hours: 2:00 PM – 11:59 PM daily
            </div>
          </div>
        )}
      </div>
    </main>
  );
}