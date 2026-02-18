"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatMonthKey, getTodayInTimezone } from "@/lib/date";
import { AppHeader } from "@/components/AppHeader";
import { AddHabitInput } from "@/components/AddHabitInput";
import { ProgressCard } from "@/components/ProgressCard";
import { HabitGrid } from "@/components/HabitGrid";
import { EmptyState } from "@/components/EmptyState";
import { PageTabs } from "@/components/PageTabs";

type User = {
  id: string;
  name: string;
  email: string;
  timezone: string;
};

type Habit = {
  id: string;
  name: string;
  order: number;
  streak: number;
  streakFreezeDate: string | null;
  isFrozenToday: boolean;
  createdAt: string;
};

type Completion = {
  habitId: string;
  date: string;
  completed: boolean;
};

type Progress = {
  totalChecks: number;
  completedChecks: number;
  percentage: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionSet, setCompletionSet] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Progress>({ totalChecks: 0, completedChecks: 0, percentage: 0 });
  const [currentDate] = useState(new Date());
  const [daysWindow] = useState(7);
  const [windowEndKey, setWindowEndKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => getTodayInTimezone(user?.timezone ?? "Asia/Kolkata"), [user?.timezone]);
  const monthKey = useMemo(() => formatMonthKey(currentDate), [currentDate]);

  const recentDays = useMemo(() => {
    const baseKey = windowEndKey ?? todayKey;
    const [year, month, day] = baseKey.split("-").map(Number);
    if (!year || !month || !day) return [];
    const base = new Date(Date.UTC(year, month - 1, day));
    const result: { key: string; label: string; weekday: string; isToday: boolean }[] = [];
    for (let offset = daysWindow - 1; offset >= 0; offset -= 1) {
      const date = new Date(base);
      date.setUTCDate(base.getUTCDate() - offset);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      const weekday = date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      });
      result.push({ key, label, weekday, isToday: key === todayKey });
    }
    return result;
  }, [todayKey, daysWindow, windowEndKey]);

  const recentMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    recentDays.forEach((day) => keys.add(day.key.slice(0, 7)));
    return Array.from(keys);
  }, [recentDays]);

  const loadMonthData = useCallback(async () => {
    if (!user) return;
    try {
      const completionSets = await Promise.all(
        recentMonthKeys.map((key) =>
          apiFetch<Completion[]>(`/api/completions?month=${key}`, { method: "GET" })
        )
      );
      const set = new Set<string>();
      completionSets.flat().forEach((c) => {
        if (c.completed) set.add(`${c.habitId}|${c.date}`);
      });
      setCompletionSet(set);

      const progressData = await apiFetch<Progress>(
        `/api/progress?month=${monthKey}`,
        { method: "GET" }
      );
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
    }
  }, [user, monthKey, recentMonthKeys]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError(null);
        const me = await apiFetch<User>("/api/auth/me", { method: "GET" });
        if (!active) return;
        setUser(me);

        const habitData = await apiFetch<Habit[]>("/api/habits", { method: "GET" });
        if (!active) return;
        setHabits(habitData);

      } catch {
        if (active) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadMonthData().catch(() => null);
  }, [monthKey, user, loadMonthData]);

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  }

  async function addHabit(name: string) {
    setError(null);
    const habit = await apiFetch<Habit>("/api/habits", {
      method: "POST",
      json: { name },
    });
    setHabits((prev) => [...prev, habit].sort((a, b) => a.order - b.order));
    await loadMonthData();
  }

  async function deleteHabit(id: string) {
    setError(null);
    await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletionSet((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((key) => {
        if (key.startsWith(`${id}|`)) next.delete(key);
      });
      return next;
    });
    await loadMonthData();
  }

  async function toggleCompletion(habitId: string, dateKey: string) {
    setError(null);
    const key = `${habitId}|${dateKey}`;
    setCompletionSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    try {
      const result = await apiFetch<{ completed: boolean; streak: number }>(
        "/api/completions/toggle",
        { method: "POST", json: { habitId, date: dateKey } }
      );
      setCompletionSet((prev) => {
        const next = new Set(prev);
        if (result.completed) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, streak: result.streak } : h))
      );
      await loadMonthData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  }

  async function toggleFreeze(habitId: string) {
    setError(null);
    try {
      const result = await apiFetch<{
        habitId: string;
        streak: number;
        streakFreezeDate: string | null;
        isFrozenToday: boolean;
      }>(`/api/habits/${habitId}/freeze`, { method: "POST" });

      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                streak: result.streak,
                streakFreezeDate: result.streakFreezeDate,
                isFrozenToday: result.isFrozenToday,
              }
            : h
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Freeze toggle failed");
    }
  }

  async function moveHabit(index: number, direction: "up" | "down") {
    const next = [...habits];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setHabits(next);
    await apiFetch("/api/habits/reorder", {
      method: "POST",
      json: { orderedIds: next.map((h) => h.id) },
    });
  }

  function shiftDays(direction: "prev" | "next") {
    const baseKey = windowEndKey ?? todayKey;
    const [year, month, day] = baseKey.split("-").map(Number);
    if (!year || !month || !day) return;
    const base = new Date(Date.UTC(year, month - 1, day));
    base.setUTCDate(base.getUTCDate() + (direction === "prev" ? -7 : 7));
    const y = base.getUTCFullYear();
    const m = String(base.getUTCMonth() + 1).padStart(2, "0");
    const d = String(base.getUTCDate()).padStart(2, "0");
    setWindowEndKey(`${y}-${m}-${d}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--text-secondary)]">
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppHeader
        userName={user.name}
        currentDate={currentDate}
        timezone={user.timezone}
        onLogout={logout}
      />

      <main className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageTabs active="dashboard" />
        <AddHabitInput onAdd={addHabit} />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <ProgressCard
            percentage={progress.percentage}
            completed={progress.completedChecks}
            total={progress.totalChecks}
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => shiftDays("prev")}
                className="flex items-center gap-2 rounded-full border border-[color:var(--border-default)] px-4 py-2 text-xs text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)]"
              >
                {"\u2190"} Previous 7
              </button>
              <button
                onClick={() => shiftDays("next")}
                className="flex items-center gap-2 rounded-full border border-[color:var(--border-default)] px-4 py-2 text-xs text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)]"
              >
                Next 7 {"\u2192"}
              </button>
            </div>
          </div>
        </div>

        {habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitGrid
            habits={habits}
            days={recentDays}
            todayKey={todayKey}
            completionSet={completionSet}
            onToggle={toggleCompletion}
            onToggleFreeze={toggleFreeze}
            onDelete={deleteHabit}
            onMove={moveHabit}
          />
        )}

        {error && (
          <div className="rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
