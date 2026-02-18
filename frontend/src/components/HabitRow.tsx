type Habit = {
  id: string;
  name: string;
  order: number;
  streak: number;
  streakFreezeDate: string | null;
  isFrozenToday: boolean;
  createdAt: string;
};

type HabitRowProps = {
  habit: Habit;
  index: number;
  totalHabits: number;
  days: { key: string; label: string; weekday: string; isToday: boolean }[];
  todayKey: string;
  completionSet: Set<string>;
  onToggle: (habitId: string, dateKey: string) => void;
  onToggleFreeze: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
};

function isFuture(dateKeyValue: string, todayKey: string) {
  return dateKeyValue > todayKey;
}

export function HabitRow({
  habit,
  index,
  totalHabits,
  days,
  todayKey,
  completionSet,
  onToggle,
  onToggleFreeze,
  onDelete,
  onMove,
}: HabitRowProps) {
  const completedToday = completionSet.has(`${habit.id}|${todayKey}`);
  const rowTone = index % 2 === 0 ? "bg-[color:var(--bg-card)]" : "bg-[#11161c]";
  return (
    <div className="space-y-3">
      <div
        className={`group rounded-xl border border-[color:var(--border-subtle)] p-4 transition-colors duration-200 hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--accent)]/[0.07] sm:hidden ${rowTone}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{habit.name}</div>
            <div className="mt-1 text-xs text-[color:var(--text-muted)]">Streak: {habit.streak}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMove(index, "up")}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-default)] text-xs text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)] disabled:opacity-40"
              aria-label={`Move ${habit.name} up`}
            >
              {"\u2191"}
            </button>
            <button
              onClick={() => onMove(index, "down")}
              disabled={index === totalHabits - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-default)] text-xs text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)] disabled:opacity-40"
              aria-label={`Move ${habit.name} down`}
            >
              {"\u2193"}
            </button>
            <button
              onClick={() => onToggleFreeze(habit.id)}
              disabled={completedToday}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                habit.isFrozenToday
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                  : "border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--text-muted)]"
              } ${completedToday ? "cursor-not-allowed opacity-50 hover:border-[color:var(--border-default)]" : ""}`}
              aria-pressed={habit.isFrozenToday}
              aria-label={`Toggle streak freeze for ${habit.name}`}
            >
              {"\u2744"}
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--danger)]/40 text-xs text-[color:var(--danger)] hover:border-[color:var(--danger)]/70"
              aria-label={`Delete ${habit.name}`}
            >
              {"\u2715"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[color:var(--text-muted)]">Last {days.length} days</div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => {
              const key = day.key;
              const completed = completionSet.has(`${habit.id}|${key}`);
              const today = day.isToday;
              const disabled = isFuture(key, todayKey);
              return (
                <div key={key} className="flex shrink-0 flex-col items-center gap-1">
                  <span className="text-[10px] text-[color:var(--text-muted)]">{day.label}</span>
                  <span className="text-[10px] uppercase text-[color:var(--text-secondary)]">
                    {day.weekday}
                  </span>
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
                    {completed ? "\u2713" : ""}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="group hidden sm:grid gap-px bg-[color:var(--border-subtle)] transition-colors duration-200 hover:ring-1 hover:ring-[color:var(--accent)]/35"
        style={{
          gridTemplateColumns: `minmax(220px, 1fr) 130px repeat(${days.length}, 40px)`,
        }}
      >
        <div className={`flex items-center justify-between px-4 py-3 transition-colors duration-200 group-hover:bg-[color:var(--accent)]/[0.07] ${rowTone}`}>
          <span className="text-sm font-medium">{habit.name}</span>
          <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => onMove(index, "up")}
              disabled={index === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border-default)] text-xs text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)] disabled:opacity-40"
              aria-label={`Move ${habit.name} up`}
            >
              {"\u2191"}
            </button>
            <button
              onClick={() => onMove(index, "down")}
              disabled={index === totalHabits - 1}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border-default)] text-xs text-[color:var(--text-muted)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)] disabled:opacity-40"
              aria-label={`Move ${habit.name} down`}
            >
              {"\u2193"}
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--danger)]/40 text-xs text-[color:var(--danger)] hover:border-[color:var(--danger)]/70"
              aria-label={`Delete ${habit.name}`}
            >
              {"\u2715"}
            </button>
          </div>
        </div>

        <div className={`flex items-center justify-between px-3 py-3 transition-colors duration-200 group-hover:bg-[color:var(--accent)]/[0.07] ${rowTone}`}>
          <span
            className={`text-sm font-semibold ${
              habit.streak > 0 ? "text-[color:var(--accent)]" : "text-[color:var(--text-muted)]"
            }`}
          >
            {habit.streak}
          </span>
          <button
            onClick={() => onToggleFreeze(habit.id)}
            disabled={completedToday}
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
              habit.isFrozenToday
                ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                : "border-[color:var(--border-default)] text-[color:var(--text-muted)] hover:border-[color:var(--text-muted)]"
            } ${completedToday ? "cursor-not-allowed opacity-50 hover:border-[color:var(--border-default)]" : ""}`}
            aria-pressed={habit.isFrozenToday}
            aria-label={`Toggle streak freeze for ${habit.name}`}
          >
            {"\u2744"}
          </button>
        </div>

        {days.map((day) => {
          const key = day.key;
          const completed = completionSet.has(`${habit.id}|${key}`);
          const today = day.isToday;
          const disabled = isFuture(key, todayKey);

          return (
            <div
              key={key}
              className={`p-1.5 transition-colors duration-200 group-hover:bg-[color:var(--accent)]/[0.07] ${rowTone}`}
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
                {completed ? "\u2713" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
