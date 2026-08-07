"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Lock, User } from "lucide-react";
import { getLocationById } from "@/lib/locations";

export default function LocationLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.location as string;
  const location = getLocationById(locationId);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!location) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <p className="text-black/50">Unknown location.</p>
      </main>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username === location!.username && password === location!.password) {
      router.push(`/cazerts/${location!.id}/dashboard`);
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex flex-col items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-black/5 shadow-sm p-8">
        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2 text-center">
          CAZERTS Admin
        </p>
        <h1 className="font-display font-extrabold text-2xl text-center mb-1">{location.name}</h1>
        <p className="text-xs text-black/40 text-center mb-8">{location.address}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <User size={16} className="text-black/40" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="flex-1 outline-none text-sm"
              autoComplete="username"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <Lock size={16} className="text-black/40" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="flex-1 outline-none text-sm"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[var(--color-magenta)] text-white font-bold hover:bg-[var(--color-magenta-dark)] transition-colors"
          >
            Log In
          </button>
        </form>
      </div>

      <Link href="/cazerts" className="text-sm text-black/40 hover:text-black mt-8">
        ← Choose a different location
      </Link>
    </main>
  );
}