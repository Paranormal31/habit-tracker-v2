type Habit = {
  id: string;
  name: string;
  order: number;
  streak: number;
  createdAt: string;
};

type HabitRowProps = {
  habit: Habit;
  index: number;
  totalHabits: number;
  days: number[];
  year: number;
  month: number;
  todayKey: string;
  isTodayMonth: boolean;
  completionSet: Set<string>;
  onToggle: (habitId: string, dateKey: string) => void;
  onDelete: (habitId: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
};

function dateKey(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function isFuture(dateKeyValue: string, todayKey: string) {
  return dateKeyValue > todayKey;
}

export function HabitRow({
  habit,
  index,
  totalHabits,
  days,
  year,
  month,
  todayKey,
  isTodayMonth,
  completionSet,
  onToggle,
  onDelete,
  onMove,
}: HabitRowProps) {
  return (
    <div
      className="group grid gap-px bg-[color:var(--border-subtle)]"
      style={{
        gridTemplateColumns: `minmax(220px, 1fr) 90px repeat(${days.length}, 40px)`,
      }}
    >
      <div className="flex items-center justify-between bg-[color:var(--bg-card)] px-4 py-3">
        <span className="text-sm font-medium">{habit.name}</span>
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="rounded border border-[color:var(--border-default)] px-1.5 py-0.5 text-xs text-[color:var(--text-muted)] disabled:opacity-40"
          >
            Up
          </button>
          <button
            onClick={() => onMove(index, "down")}
            disabled={index === totalHabits - 1}
            className="rounded border border-[color:var(--border-default)] px-1.5 py-0.5 text-xs text-[color:var(--text-muted)] disabled:opacity-40"
          >
            Down
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="rounded border border-[color:var(--danger)]/40 px-1.5 py-0.5 text-xs text-[color:var(--danger)]"
          >
            Del
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[color:var(--bg-card)] px-3 py-3">
        <span
          className={`text-sm font-semibold ${
            habit.streak > 0 ? "text-[color:var(--accent)]" : "text-[color:var(--text-muted)]"
          }`}
        >
          {habit.streak}
        </span>
      </div>

      {days.map((day) => {
        const key = dateKey(year, month, day);
        const completed = completionSet.has(`${habit.id}|${key}`);
        const today = isTodayMonth && key === todayKey;
        const disabled = isFuture(key, todayKey);

        return (
          <div
            key={day}
            className="bg-[color:var(--bg-card)] p-1.5"
          >
            <button
              onClick={() => onToggle(habit.id, key)}
              disabled={disabled}
              className={`h-8 w-8 rounded-md border transition ${
                completed
                  ? "bg-[color:var(--accent)] text-black border-[color:var(--accent)]"
                  : today
                  ? "bg-[color:var(--bg-surface)] border-[color:var(--accent)]/40 text-[color:var(--text-secondary)]"
                  : "bg-[color:var(--bg-surface)] border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--text-muted)]"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              aria-label={`Toggle ${habit.name} on ${key}`}
            >
              {completed ? "✓" : ""}
            </button>
          </div>
        );
      })}
    </div>
  );
}
