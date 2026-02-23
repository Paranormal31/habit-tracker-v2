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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
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
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => defaultBlocks);
  const [startHour, setStartHour] = useState("09");
  const [startMin, setStartMin] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHour, setEndHour] = useState("10");
  const [endMin, setEndMin] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const dailyFocusStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef<TimeBlock[]>(defaultBlocks);
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
    const next = [...dailyFocusItems];
    const index = next.findIndex((item) => item.label === label);
    if (index < 0) return;
    next[index] = { ...next[index], text: value };
    setDailyFocusItems(next);
    debounceDailyFocusSave(next);
  }

  function toggleDailyFocusDone(label: FocusLabel) {
    const next = [...dailyFocusItems];
    const index = next.findIndex((item) => item.label === label);
    if (index < 0) return;
    next[index] = { ...next[index], done: !next[index].done };
    setDailyFocusItems(next);
    // toggle saves immediately
    dailyFocusRef.current = next;
    if (plannerDateKey) saveDailyFocusToServer(next, plannerDateKey);
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
    const next = blocks.map((block, i) =>
      i === index ? { ...block, [field]: value } : block
    );
    setBlocks(next);
    blocksRef.current = next;

    // Debounce save on text edits
    if (blocksSaveTimer.current) clearTimeout(blocksSaveTimer.current);
    blocksSaveTimer.current = setTimeout(() => {
      if (plannerDateKey) saveBlocksToServer(blocksRef.current, plannerDateKey);
    }, 600);
  }

  function addBlock() {
    const time = `${startHour}:${startMin} ${startPeriod} - ${endHour}:${endMin} ${endPeriod}`;
    const newBlock = { time, plan: "", notes: "" };
    const next = [...blocks, newBlock];
    setBlocks(next);
    blocksRef.current = next;
    if (plannerDateKey) saveBlocksToServer(next, plannerDateKey);
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
              <div className="flex flex-wrap items-center gap-6 bg-[color:var(--bg-card)]/50 p-5 rounded-2xl border border-[color:var(--border-default)]/40">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-widest">Start</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[color:var(--bg-surface)] p-1 rounded-lg border border-[color:var(--border-default)] focus-within:border-[color:var(--accent)]/60 transition-colors">
                      <input
                        type="text"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="w-8 bg-transparent text-center text-sm font-medium text-[color:var(--text-primary)] outline-none"
                        placeholder="09"
                      />
                      <span className="text-[color:var(--text-muted)] font-bold">:</span>
                      <input
                        type="text"
                        value={startMin}
                        onChange={(e) => setStartMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="w-8 bg-transparent text-center text-sm font-medium text-[color:var(--text-primary)] outline-none"
                        placeholder="00"
                      />
                    </div>
                    <div className="flex border border-[color:var(--border-default)] rounded-lg overflow-hidden">
                      {(["AM", "PM"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setStartPeriod(p)}
                          className={`px-3 py-1.5 text-[10px] font-bold transition-all ${
                            startPeriod === p
                              ? "bg-[color:var(--accent)] text-black"
                              : "bg-[color:var(--bg-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-widest">End</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[color:var(--bg-surface)] p-1 rounded-lg border border-[color:var(--border-default)] focus-within:border-[color:var(--accent)]/60 transition-colors">
                      <input
                        type="text"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="w-8 bg-transparent text-center text-sm font-medium text-[color:var(--text-primary)] outline-none"
                        placeholder="10"
                      />
                      <span className="text-[color:var(--text-muted)] font-bold">:</span>
                      <input
                        type="text"
                        value={endMin}
                        onChange={(e) => setEndMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="w-8 bg-transparent text-center text-sm font-medium text-[color:var(--text-primary)] outline-none"
                        placeholder="00"
                      />
                    </div>
                    <div className="flex border border-[color:var(--border-default)] rounded-lg overflow-hidden">
                      {(["AM", "PM"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setEndPeriod(p)}
                          className={`px-3 py-1.5 text-[10px] font-bold transition-all ${
                            endPeriod === p
                              ? "bg-[color:var(--accent)] text-black"
                              : "bg-[color:var(--bg-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={addBlock}
                  className="ml-auto rounded-xl bg-[color:var(--accent)] px-8 py-2.5 text-xs font-bold text-black hover:bg-[color:var(--accent)]/90 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Add Block
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
