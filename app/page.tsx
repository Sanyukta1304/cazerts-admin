"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ChevronDown, Check } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import { SUPER_ADMIN, SUPER_ADMIN_FLAG } from "@/lib/superadmin";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username) {
      setError("Please select a username.");
      return;
    }

    // Super admin: goes to the all-stores sales page
    if (username === SUPER_ADMIN.username) {
      if (password === SUPER_ADMIN.password) {
        try {
          sessionStorage.setItem(SUPER_ADMIN_FLAG, "1");
        } catch {}
        router.push("/superadmin/sales");
      } else {
        setError("Incorrect username or password.");
      }
      return;
    }

    // Store admins: go to their own store dashboard
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
          {/* Username */}
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <User size={16} className="text-black/40" />
            <select
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className={`flex-1 outline-none text-sm font-bold bg-transparent appearance-none cursor-pointer ${
                username ? "text-black" : "text-black/40"
              }`}
            >
              <option value="" disabled className="font-bold text-black/40">
                Select username
              </option>
              {LOCATIONS.map((loc) => (
                <option
                  key={loc.id}
                  value={loc.username}
                  className="font-bold text-black"
                >
                  {loc.username}
                </option>
              ))}
              <option value={SUPER_ADMIN.username} className="font-bold text-black">
                {SUPER_ADMIN.username}
              </option>
            </select>
            <ChevronDown size={16} className="text-black/40 pointer-events-none" />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/15 focus-within:border-[var(--color-magenta)]">
            <Lock size={16} className="text-black/40" />
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="flex-1 outline-none text-sm font-semibold"
              autoComplete="current-password"
            />
          </div>

          {/* Show password checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="peer sr-only"
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-black/25 bg-white transition-colors peer-checked:border-[var(--color-magenta)] peer-checked:bg-[var(--color-magenta)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-magenta)]/30 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
              <Check size={14} strokeWidth={3.5} className="text-white" />
            </span>
            <span className="text-sm font-semibold text-black/60">Show password</span>
          </label>

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