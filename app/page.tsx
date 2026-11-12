"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ChevronDown } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";

export default function CazertsLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username) {
      setError("Please select a username.");
      return;
    }

    const location = LOCATIONS.find((loc) => loc.username === username);

    if (location && password === location.password) {
      router.push(`/cazerts/${location.id}/dashboard`);
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
        <h1 className="font-display font-extrabold text-2xl text-center mb-8">Log In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <User size={16} className="text-black/40" />
            <select
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className={`flex-1 outline-none text-sm bg-transparent appearance-none cursor-pointer ${
                username ? "text-black" : "text-black/40"
              }`}
            >
              <option value="" disabled>
                Select username
              </option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.username}>
                  {loc.username}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="text-black/40 pointer-events-none" />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <Lock size={16} className="text-black/40" />
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
    </main>
  );
}