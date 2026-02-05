"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        json: {
          name,
          email,
          password,
          timezone: "Asia/Kolkata",
        },
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
            Habit Tracker
          </p>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Start building consistent habits in IST.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text-secondary)]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              placeholder="Your name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text-secondary)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              placeholder="Create a password"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-black transition hover:bg-[color:var(--accent-muted)] disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
          Already have an account?{" "}
          <Link className="text-[color:var(--accent)] hover:underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
