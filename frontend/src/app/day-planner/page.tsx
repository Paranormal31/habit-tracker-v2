"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { PageTabs } from "@/components/PageTabs";

type User = {
  id: string;
  name: string;
  email: string;
  timezone: string;
};

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  done: boolean;
};

type TimeBlock = {
  time: string;
  plan: string;
  notes: string;
};

const defaultBlocks: TimeBlock[] = [];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DayPlannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [plannerDate, setPlannerDate] = useState(() => new Date());
  const [focus, setFocus] = useState("");
  const [focusDone, setFocusDone] = useState(false);
  const [topThree, setTopThree] = useState(["", "", ""]);
  const [topThreeDone, setTopThreeDone] = useState([false, false, false]);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => defaultBlocks);
  const [newBlockTime, setNewBlockTime] = useState("");
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError(null);
        const me = await apiFetch<User>("/api/auth/me", { method: "GET" });
        if (!active) return;
        setUser(me);
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

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: user?.timezone,
    }).format(plannerDate);
  }, [plannerDate, user?.timezone]);

  function changeDay(direction: "prev" | "next") {
    setPlannerDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "prev" ? -1 : 1));
      return next;
    });
  }

  function resetToday() {
    setPlannerDate(new Date());
  }

  function updateTopThree(index: number, value: string) {
    setTopThree((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function toggleTopThreeDone(index: number) {
    setTopThreeDone((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks((prev) => [
      ...prev,
      { id: createId(), title, priority: newPriority, done: false },
    ]);
    setNewTask("");
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function updateBlock(index: number, field: keyof TimeBlock, value: string) {
    setBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, [field]: value } : block))
    );
  }

  function addBlock() {
    const time = newBlockTime.trim();
    if (!time) return;
    setBlocks((prev) => [...prev, { time, plan: "", notes: "" }]);
    setNewBlockTime("");
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--text-secondary)]">
        Loading planner...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppHeader
        userName={user.name}
        currentDate={plannerDate}
        timezone={user.timezone}
        onLogout={logout}
      />

      <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        <PageTabs active="planner" />

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] px-6 py-4">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">Plan for</p>
            <h2 className="text-2xl font-semibold">{formattedDate}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => changeDay("prev")}
              className="rounded-full border border-[color:var(--border-default)] px-4 py-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            >
              Previous
            </button>
            <button
              onClick={resetToday}
              className="rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/15 px-4 py-2 text-sm text-[color:var(--accent)]"
            >
              Today
            </button>
            <button
              onClick={() => changeDay("next")}
              className="rounded-full border border-[color:var(--border-default)] px-4 py-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            >
              Next
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Time Blocks</h3>
                  <p className="text-sm text-[color:var(--text-muted)]">Map the day to reduce context switching.</p>
                </div>
                <span className="text-xs text-[color:var(--text-muted)]">{blocks.length} blocks</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={newBlockTime}
                  onChange={(event) => setNewBlockTime(event.target.value)}
                  placeholder="Add a time block (e.g. 09:00 - 10:30)"
                  className="flex-1 rounded-lg border border-[color:var(--border-default)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60"
                />
                <button
                  onClick={addBlock}
                  className="rounded-lg border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/20 px-4 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:var(--accent)]/30"
                >
                  Add block
                </button>
              </div>
              <div className="space-y-4">
                {blocks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[color:var(--border-default)] px-4 py-6 text-sm text-[color:var(--text-muted)]">
                    No time blocks yet. Add the time ranges you want to plan.
                  </div>
                ) : (
                  blocks.map((block, index) => (
                  <div
                    key={block.time}
                    className="rounded-xl border border-[color:var(--border-default)]/60 bg-[color:var(--bg-card)] p-4"
                    draggable
                    onDragStart={() => setDraggedBlockIndex(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedBlockIndex === null) return;
                      reorderBlocks(draggedBlockIndex, index);
                      setDraggedBlockIndex(null);
                    }}
                    onDragEnd={() => setDraggedBlockIndex(null)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[color:var(--accent)]">{block.time}</span>
                      <button
                        onClick={() => removeBlock(index)}
                        className="text-xs text-[color:var(--danger)] hover:text-[color:var(--danger)]/80"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        value={block.plan}
                        onChange={(event) => updateBlock(index, "plan", event.target.value)}
                        placeholder="Primary plan"
                        className="flex-1 rounded-lg border border-[color:var(--border-default)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60"
                      />
                    </div>
                    <textarea
                      value={block.notes}
                      onChange={(event) => updateBlock(index, "notes", event.target.value)}
                      placeholder="Notes, prep, or reminders"
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-[color:var(--border-default)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60"
                    />
                  </div>
                ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">Task Stack</h3>
                  <p className="text-sm text-[color:var(--text-muted)]">Capture everything and prioritize.</p>
                </div>
                <span className="text-xs text-[color:var(--text-muted)]">{tasks.length} tasks</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={newTask}
                  onChange={(event) => setNewTask(event.target.value)}
                  placeholder="Add a task"
                  className="flex-1 rounded-lg border border-[color:var(--border-default)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60"
                />
                <select
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value as Task["priority"])}
                  className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-card)] px-3 py-2 text-sm text-[color:var(--text-secondary)]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={addTask}
                  className="rounded-lg border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/20 px-4 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:var(--accent)]/30"
                >
                  Add
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[color:var(--border-default)] px-4 py-6 text-sm text-[color:var(--text-muted)]">
                  No tasks yet. Add the next action that moves you forward.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-card)] px-4 py-3"
                    >
                      <label className="flex flex-1 items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                          className="h-4 w-4 accent-[color:var(--accent)]"
                        />
                        <span className={task.done ? "line-through text-[color:var(--text-muted)]" : ""}>
                          {task.title}
                        </span>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-[color:var(--border-default)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
                          {task.priority}
                        </span>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="text-xs text-[color:var(--danger)] hover:text-[color:var(--danger)]/80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Daily Focus</h3>
                <p className="text-sm text-[color:var(--text-muted)]">If you only win one thing, make it this.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFocusDone((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                    focusDone
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                      : "border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/60"
                  }`}
                  aria-pressed={focusDone}
                  aria-label="Mark daily focus completed"
                >
                  {focusDone ? "✓" : ""}
                </button>
                <input
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder="Main focus"
                  className={`w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60 ${
                    focusDone
                      ? "border-[color:var(--accent)]/60 text-[color:var(--text-muted)] line-through"
                      : "border-[color:var(--border-default)]"
                  }`}
                />
              </div>
              <div className="space-y-2">
                {topThree.map((item, index) => (
                  <div key={`top-${index}`} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTopThreeDone(index)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                        topThreeDone[index]
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                          : "border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/60"
                      }`}
                      aria-pressed={topThreeDone[index]}
                      aria-label={`Mark Top ${index + 1} completed`}
                    >
                      {topThreeDone[index] ? "✓" : ""}
                    </button>
                    <input
                      value={item}
                      onChange={(event) => updateTopThree(index, event.target.value)}
                      placeholder={`Top ${index + 1}`}
                      className={`w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60 ${
                        topThreeDone[index]
                          ? "border-[color:var(--accent)]/60 text-[color:var(--text-muted)] line-through"
                          : "border-[color:var(--border-default)]"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Notes</h3>
                <p className="text-sm text-[color:var(--text-muted)]">Capture ideas, blockers, and reflections.</p>
              </div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What else matters today?"
                rows={8}
                className="w-full rounded-lg border border-[color:var(--border-default)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60"
              />
            </section>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
