"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  Variants,
} from "framer-motion";
import { Lock, User, ChevronDown, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import { SUPER_ADMIN, SUPER_ADMIN_FLAG } from "@/lib/superadmin";

type Status = "idle" | "loading" | "success";

const FLOATERS = [
  { emoji: "🍦", left: "8%", top: "14%", size: 54, delay: 0, dur: 6 },
  { emoji: "🍨", left: "78%", top: "10%", size: 62, delay: 0.8, dur: 7 },
  { emoji: "🧁", left: "14%", top: "62%", size: 50, delay: 1.4, dur: 6.5 },
  { emoji: "🍰", left: "70%", top: "58%", size: 58, delay: 0.4, dur: 7.5 },
  { emoji: "🍫", left: "44%", top: "84%", size: 44, delay: 1.1, dur: 6.2 },
  { emoji: "🍓", left: "88%", top: "82%", size: 40, delay: 1.8, dur: 5.8 },
];

const CHIPS = ["Live sales", "Inventory", "Raw material", "Order tracking"];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const shake = useAnimation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Spotlight that follows the mouse on the brand panel
  const mx = useMotionValue(320);
  const my = useMotionValue(320);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(230,0,126,0.32), transparent 60%)`;

  function onPanelMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  function fail(message: string) {
    setError(message);
    shake.start({
      x: [0, -12, 12, -9, 9, -4, 0],
      transition: { duration: 0.5 },
    });
  }

  // Spinner -> tick -> full-screen reveal -> go to the dashboard
  function proceed(go: () => void) {
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setTimeout(go, 1200);
    }, 700);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;

    if (!username) {
      fail("Please select a username.");
      return;
    }

    // Super admin: goes to the all-stores sales page
    if (username === SUPER_ADMIN.username) {
      if (password === SUPER_ADMIN.password) {
        try {
          sessionStorage.setItem(SUPER_ADMIN_FLAG, "1");
        } catch {}
        proceed(() => router.push("/superadmin/sales"));
      } else {
        fail("Incorrect username or password.");
      }
      return;
    }

    // Store admins: go to their own store dashboard
    const location = LOCATIONS.find((loc) => loc.username === username);

    if (location && password === location.password) {
      proceed(() => router.push(`/cazerts/${location.id}/dashboard`));
    } else {
      fail("Incorrect username or password.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] lg:grid lg:grid-cols-2">
      {/* ---------- Brand panel (desktop) ---------- */}
      <div
        onMouseMove={onPanelMove}
        className="relative hidden overflow-hidden bg-black lg:flex lg:flex-col lg:justify-center lg:px-16"
      >
        {/* Mouse spotlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
        />

        {/* Drifting glows */}
        <motion.div
          aria-hidden
          className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[var(--color-magenta)] opacity-30 blur-[110px]"
          animate={reduceMotion ? undefined : { x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-pink-500 opacity-20 blur-[120px]"
          animate={reduceMotion ? undefined : { x: [0, -70, 0], y: [0, -50, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating desserts */}
        {FLOATERS.map((f) => (
          <motion.span
            key={f.emoji}
            aria-hidden
            className="pointer-events-none absolute select-none opacity-40"
            style={{ left: f.left, top: f.top, fontSize: f.size }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
              reduceMotion
                ? { opacity: 0.4, scale: 1 }
                : { opacity: 0.4, scale: 1, y: [0, -22, 0], rotate: [-7, 7, -7] }
            }
            transition={{
              opacity: { duration: 0.8, delay: f.delay },
              scale: { duration: 0.8, delay: f.delay },
              y: { duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: f.delay },
              rotate: { duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: f.delay },
            }}
          >
            {f.emoji}
          </motion.span>
        ))}

        {/* Brand content */}
        <div className="relative z-10">
          <div className="flex items-center font-display text-6xl font-extrabold tracking-[0.2em] text-white xl:text-7xl">
            {"CAZERTS".split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.6, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              className="ml-3 inline-block h-4 w-4 rounded-full bg-[var(--color-magenta)]"
              initial={{ scale: 0 }}
              animate={reduceMotion ? { scale: 1 } : { scale: [0, 1.4, 1], opacity: [1, 1, 1] }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <motion.span
                className="block h-full w-full rounded-full bg-[var(--color-magenta)]"
                animate={reduceMotion ? undefined : { scale: [1, 2.2], opacity: [0.6, 0] }}
                transition={{ delay: 1.4, duration: 1.6, repeat: Infinity }}
              />
            </motion.span>
          </div>

          <motion.p
            className="mt-6 max-w-md text-xl font-semibold leading-snug text-white/70"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            Every store. Every order.
            <br />
            <span className="text-[var(--color-magenta)]">One place.</span>
          </motion.p>

          <div className="mt-8 flex max-w-md flex-wrap gap-2.5">
            {CHIPS.map((c, i) => (
              <motion.span
                key={c}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1, type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.06, borderColor: "rgba(230,0,126,0.8)" }}
              >
                {c}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-20">
        {/* Soft background glow (visible on mobile too) */}
        <motion.div
          aria-hidden
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--color-magenta)] opacity-10 blur-[90px]"
          animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div animate={shake} className="relative w-full max-w-sm">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-black/5 bg-white p-8 shadow-xl shadow-black/5"
          >
            {/* Brand (mobile only) */}
            <motion.p
              variants={item}
              className="mb-1 text-center font-display text-lg font-extrabold tracking-[0.25em] lg:hidden"
            >
              CAZERTS<span className="ml-1 text-[var(--color-magenta)]">●</span>
            </motion.p>

            <motion.p
              variants={item}
              className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-magenta)]"
            >
              CAZERTS Admin
            </motion.p>
            <motion.h1
              variants={item}
              className="mb-8 text-center font-display text-2xl font-extrabold"
            >
              Welcome back
            </motion.h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <motion.div
                variants={item}
                className="relative flex items-center gap-3 rounded-2xl border border-black/15 px-4 py-3 transition-all focus-within:border-[var(--color-magenta)] focus-within:shadow-[0_0_0_4px_rgba(230,0,126,0.12)]"
              >
                <User size={16} className="text-black/40" />
                <select
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  className={`flex-1 cursor-pointer appearance-none bg-transparent text-sm font-bold outline-none ${
                    username ? "text-black" : "text-black/40"
                  }`}
                >
                  <option value="" disabled className="font-bold text-black/40">
                    Select username
                  </option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.username} className="font-bold text-black">
                      {loc.username}
                    </option>
                  ))}
                  <option value={SUPER_ADMIN.username} className="font-bold text-black">
                    {SUPER_ADMIN.username}
                  </option>
                </select>
                <ChevronDown size={16} className="pointer-events-none text-black/40" />
              </motion.div>

              {/* Password with eye toggle */}
              <motion.div
                variants={item}
                className="flex items-center gap-3 rounded-2xl border border-black/15 px-4 py-3 transition-all focus-within:border-[var(--color-magenta)] focus-within:shadow-[0_0_0_4px_rgba(230,0,126,0.12)]"
              >
                <Lock size={16} className="text-black/40" />
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-black/40 transition-colors hover:text-[var(--color-magenta)]"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPassword ? "on" : "off"}
                      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                      className="flex"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={item}>
                <motion.button
                  type="submit"
                  disabled={status !== "idle"}
                  whileHover={status === "idle" ? { scale: 1.02 } : undefined}
                  whileTap={status === "idle" ? { scale: 0.97 } : undefined}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--color-magenta)] py-3.5 font-bold text-white shadow-lg shadow-[var(--color-magenta)]/30 transition-colors hover:bg-[var(--color-magenta-dark)] disabled:cursor-default"
                >
                  {/* Shimmer sweep */}
                  {!reduceMotion && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25"
                      initial={{ x: "-150%" }}
                      animate={{ x: "450%" }}
                      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
                    />
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    {status === "idle" && (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="relative"
                      >
                        Log In
                      </motion.span>
                    )}
                    {status === "loading" && (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="relative flex items-center gap-2"
                      >
                        <Loader2 size={18} className="animate-spin" />
                        Signing in...
                      </motion.span>
                    )}
                    {status === "success" && (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="relative flex items-center gap-2"
                      >
                        <Check size={18} strokeWidth={3.5} />
                        Welcome!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* ---------- Full-screen reveal on success ---------- */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-magenta)] text-white"
            initial={{ clipPath: "circle(0% at 50% 60%)" }}
            animate={{ clipPath: "circle(150% at 50% 60%)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.p
              className="font-display text-4xl font-extrabold tracking-[0.2em] md:text-5xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              CAZERTS
            </motion.p>
            <motion.p
              className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Welcome back
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}