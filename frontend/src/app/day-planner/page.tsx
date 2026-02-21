"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type FocusLabel = "primary" | "secondary" | "tertiary";

type DailyFocusItem = {
  label: FocusLabel;
  text: string;
  done: boolean;
};

type DailyFocusResponse = {
  date: string;
  items: DailyFocusItem[];
};

const focusLabels: FocusLabel[] = ["primary", "secondary", "tertiary"];

const defaultBlocks: TimeBlock[] = [];

function createDefaultDailyFocusItems(): DailyFocusItem[] {
  return focusLabels.map((label) => ({ label, text: "", done: false }));
}

function formatPlannerDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

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
  const [dailyFocusItems, setDailyFocusItems] = useState<DailyFocusItem[]>(
    createDefaultDailyFocusItems
  );
  const [dailyFocusStatus, setDailyFocusStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => defaultBlocks);
  const [newBlockTime, setNewBlockTime] = useState("");
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const dailyFocusStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef<TimeBlock[]>(defaultBlocks);
  const tasksSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tasksRef = useRef<Task[]>([]);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef<string>("");
  const dailyFocusSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dailyFocusRef = useRef<DailyFocusItem[]>(createDefaultDailyFocusItems());

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

  const plannerDateKey = useMemo(() => {
    if (!user?.timezone) return "";
    return formatPlannerDateKey(plannerDate, user.timezone);
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

  useEffect(() => {
    return () => {
      if (dailyFocusStatusTimer.current) clearTimeout(dailyFocusStatusTimer.current);
      if (blocksSaveTimer.current) clearTimeout(blocksSaveTimer.current);
      if (tasksSaveTimer.current) clearTimeout(tasksSaveTimer.current);
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
      if (dailyFocusSaveTimer.current) clearTimeout(dailyFocusSaveTimer.current);
    };
  }, []);

  const saveBlocksToServer = useCallback(
    async (blocksToSave: TimeBlock[], dateKey: string) => {
      try {
        await apiFetch("/api/time-blocks", {
          method: "PUT",
          json: { date: dateKey, blocks: blocksToSave },
        });
      } catch {
        // silent — best-effort
      }
    },
    []
  );

  const saveTasksToServer = useCallback(
    async (tasksToSave: Task[], dateKey: string) => {
      try {
        await apiFetch("/api/task-stack", {
          method: "PUT",
          json: {
            date: dateKey,
            tasks: tasksToSave.map((t) => ({
              taskId: t.id,
              title: t.title,
              priority: t.priority,
              done: t.done,
            })),
          },
        });
      } catch {
        // silent — best-effort
      }
    },
    []
  );

  const saveNotesToServer = useCallback(
    async (content: string, dateKey: string) => {
      try {
        await apiFetch("/api/planner-notes", {
          method: "PUT",
          json: { date: dateKey, content },
        });
      } catch {
        // silent — best-effort
      }
    },
    []
  );

  const saveDailyFocusToServer = useCallback(
    async (items: DailyFocusItem[], dateKey: string) => {
      try {
        await apiFetch("/api/daily-focus", {
          method: "PUT",
          json: { date: dateKey, items },
        });
      } catch {
        // silent — best-effort
      }
    },
    []
  );

  // ── Load time blocks ──
  useEffect(() => {
    if (!user?.timezone || !plannerDateKey) return;
    let active = true;
    (async () => {
      try {
        const r = await apiFetch<{ date: string; blocks: TimeBlock[] }>(
          `/api/time-blocks?date=${plannerDateKey}`,
          { method: "GET" }
        );
        if (!active) return;
        setBlocks(r.blocks ?? []);
        blocksRef.current = r.blocks ?? [];
      } catch {
        if (!active) return;
        setBlocks([]);
        blocksRef.current = [];
      }
    })();
    return () => { active = false; };
  }, [plannerDateKey, user?.timezone]);

  // ── Load task stack ──
  useEffect(() => {
    if (!user?.timezone || !plannerDateKey) return;
    let active = true;
    (async () => {
      try {
        const r = await apiFetch<{ date: string; tasks: { taskId: string; title: string; priority: Task["priority"]; done: boolean }[] }>(
          `/api/task-stack?date=${plannerDateKey}`,
          { method: "GET" }
        );
        if (!active) return;
        const mapped = (r.tasks ?? []).map((t) => ({ id: t.taskId, title: t.title, priority: t.priority, done: t.done }));
        setTasks(mapped);
        tasksRef.current = mapped;
      } catch {
        if (!active) return;
        setTasks([]);
        tasksRef.current = [];
      }
    })();
    return () => { active = false; };
  }, [plannerDateKey, user?.timezone]);

  // ── Load planner notes ──
  useEffect(() => {
    if (!user?.timezone || !plannerDateKey) return;
    let active = true;
    (async () => {
      try {
        const r = await apiFetch<{ date: string; content: string }>(
          `/api/planner-notes?date=${plannerDateKey}`,
          { method: "GET" }
        );
        if (!active) return;
        setNotes(r.content ?? "");
        notesRef.current = r.content ?? "";
      } catch {
        if (!active) return;
        setNotes("");
        notesRef.current = "";
      }
    })();
    return () => { active = false; };
  }, [plannerDateKey, user?.timezone]);

  // ── Load daily focus ──
  useEffect(() => {
    if (!user?.timezone || !plannerDateKey) return;
    let active = true;
    (async () => {
      try {
        const response = await apiFetch<DailyFocusResponse>(
          `/api/daily-focus?date=${plannerDateKey}`,
          { method: "GET" }
        );
        if (!active) return;
        const items = normalizeDailyFocusItems(response.items);
        setDailyFocusItems(items);
        dailyFocusRef.current = items;
      } catch {
        if (!active) return;
        const items = createDefaultDailyFocusItems();
        setDailyFocusItems(items);
        dailyFocusRef.current = items;
        setTransientDailyFocusStatus("error", "Could not load Daily Focus for this day.");
      }
    })();
    return () => { active = false; };
  }, [plannerDateKey, user?.timezone]);

  function setTransientDailyFocusStatus(
    type: "success" | "error",
    message: string
  ) {
    if (dailyFocusStatusTimer.current) {
      clearTimeout(dailyFocusStatusTimer.current);
    }
    setDailyFocusStatus({ type, message });
    dailyFocusStatusTimer.current = setTimeout(() => {
      setDailyFocusStatus(null);
    }, 3000);
  }

  function normalizeDailyFocusItems(items: DailyFocusItem[]): DailyFocusItem[] {
    const map = new Map<FocusLabel, DailyFocusItem>();
    for (const item of items) {
      if (focusLabels.includes(item.label)) {
        map.set(item.label, {
          label: item.label,
          text: item.text ?? "",
          done: Boolean(item.done),
        });
      }
    }
    return focusLabels.map((label) => map.get(label) ?? { label, text: "", done: false });
  }

  function debounceDailyFocusSave(items: DailyFocusItem[]) {
    dailyFocusRef.current = items;
    if (dailyFocusSaveTimer.current) clearTimeout(dailyFocusSaveTimer.current);
    dailyFocusSaveTimer.current = setTimeout(() => {
      if (plannerDateKey) saveDailyFocusToServer(dailyFocusRef.current, plannerDateKey);
    }, 600);
  }

  function updateDailyFocusText(label: FocusLabel, value: string) {
    setDailyFocusItems((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.label === label);
      if (index < 0) return prev;
      next[index] = { ...next[index], text: value };
      debounceDailyFocusSave(next);
      return next;
    });
  }

  function toggleDailyFocusDone(label: FocusLabel) {
    setDailyFocusItems((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.label === label);
      if (index < 0) return prev;
      next[index] = { ...next[index], done: !next[index].done };
      // toggle saves immediately
      dailyFocusRef.current = next;
      if (plannerDateKey) saveDailyFocusToServer(next, plannerDateKey);
      return next;
    });
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks((prev) => {
      const next = [
        ...prev,
        { id: createId(), title, priority: newPriority, done: false },
      ];
      tasksRef.current = next;
      if (plannerDateKey) saveTasksToServer(next, plannerDateKey);
      return next;
    });
    setNewTask("");
  }

  function toggleTask(id: string) {
    setTasks((prev) => {
      const next = prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      );
      tasksRef.current = next;
      if (plannerDateKey) saveTasksToServer(next, plannerDateKey);
      return next;
    });
  }

  function removeTask(id: string) {
    setTasks((prev) => {
      const next = prev.filter((task) => task.id !== id);
      tasksRef.current = next;
      if (plannerDateKey) saveTasksToServer(next, plannerDateKey);
      return next;
    });
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    notesRef.current = value;
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      if (plannerDateKey) saveNotesToServer(notesRef.current, plannerDateKey);
    }, 600);
  }

  function updateBlock(index: number, field: keyof TimeBlock, value: string) {
    setBlocks((prev) => {
      const next = prev.map((block, i) =>
        i === index ? { ...block, [field]: value } : block
      );
      blocksRef.current = next;
      // Debounce save on text edits
      if (blocksSaveTimer.current) clearTimeout(blocksSaveTimer.current);
      blocksSaveTimer.current = setTimeout(() => {
        if (plannerDateKey) saveBlocksToServer(blocksRef.current, plannerDateKey);
      }, 600);
      return next;
    });
  }

  function addBlock() {
    const time = newBlockTime.trim();
    if (!time) return;
    setBlocks((prev) => {
      const next = [...prev, { time, plan: "", notes: "" }];
      blocksRef.current = next;
      if (plannerDateKey) saveBlocksToServer(next, plannerDateKey);
      return next;
    });
    setNewBlockTime("");
  }

  function removeBlock(index: number) {
    setBlocks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      blocksRef.current = next;
      if (plannerDateKey) saveBlocksToServer(next, plannerDateKey);
      return next;
    });
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      blocksRef.current = next;
      if (plannerDateKey) saveBlocksToServer(next, plannerDateKey);
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
                <p className="text-sm text-[color:var(--text-muted)]">
                  If you only win one thing, make it this.
                </p>
              </div>
              {dailyFocusStatus && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    dailyFocusStatus.type === "success"
                      ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                      : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
                  }`}
                >
                  {dailyFocusStatus.message}
                </div>
              )}
              <div className="space-y-2">
                {dailyFocusItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDailyFocusDone(item.label)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                        item.done
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                          : "border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/60"
                      }`}
                      aria-pressed={item.done}
                      aria-label={`Mark ${item.label} focus completed`}
                    >
                      {item.done ? "\u2713" : ""}
                    </button>
                    <input
                      value={item.text}
                      onChange={(event) => updateDailyFocusText(item.label, event.target.value)}
                      placeholder={item.label[0].toUpperCase() + item.label.slice(1)}
                      className={`w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]/60 ${
                        item.done
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
                onChange={(event) => handleNotesChange(event.target.value)}
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
