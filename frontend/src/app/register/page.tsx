"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

const passwordRules = [
  {
    key: "min8",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    key: "uppercase",
    label: "At least one uppercase letter (A-Z)",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "At least one lowercase letter (a-z)",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "At least one number (0-9)",
    test: (value: string) => /[0-9]/.test(value),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordWarnings, setPasswordWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const passwordChecks = passwordRules.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordWarnings([]);
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
      if (err instanceof ApiError) {
        const passwordIssues = err.issues
          .filter((issue) => issue.path?.includes("password"))
          .map((issue) => issue.message)
          .filter((message): message is string => Boolean(message));
        if (passwordIssues.length > 0) {
          setPasswordWarnings(passwordIssues);
          setError("Please fix the password issues below.");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
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
            Build routines that stick with daily tracking, focus, and momentum.
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordWarnings.length) setPasswordWarnings([]);
              }}
              className="w-full rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              placeholder="Create a password"
              required
            />
            <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] px-3 py-2">
              <p className="text-xs text-[color:var(--text-secondary)]">
                Password requirements
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {passwordChecks.map((rule) => (
                  <li
                    key={rule.key}
                    className={
                      rule.valid
                        ? "text-emerald-600"
                        : "text-[color:var(--text-secondary)]"
                    }
                  >
                    {rule.valid ? "✓" : "•"} {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {passwordWarnings.length > 0 && (
            <div className="rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">
              <p className="font-medium">Please update your password:</p>
              <ul className="mt-1 list-disc pl-5">
                {passwordWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

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
