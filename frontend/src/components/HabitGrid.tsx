import { HabitRow } from "./HabitRow";

type Habit = {
  id: string;
  name: string;
  order: number;
  streak: number;
  streakFreezeDate: string | null;
  isFrozenToday: boolean;
  createdAt: string;
};

type GridDay = {
  key: string;
  label: string;
  weekday: string;
  isToday: boolean;
};

type HabitGridProps = {
  habits: Habit[];
  days: GridDay[];
  todayKey: string;
  completionSet: Set<string>;
  onToggle: (habitId: string, dateKey: string) => void;
  onToggleFreeze: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
};

export function HabitGrid({
  habits,
  days,
  todayKey,
  completionSet,
  onToggle,
  onToggleFreeze,
  onDelete,
  onMove,
}: HabitGridProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)]">
      <div className="overflow-x-auto">
        <div className="min-w-0 sm:min-w-max">
          <div
            className="hidden sm:grid gap-px bg-[color:var(--border-subtle)]"
            style={{
              gridTemplateColumns: `minmax(220px, 1fr) 130px repeat(${days.length}, 40px)`,
            }}
          >
            <div className="bg-[color:var(--bg-card)] px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)]">
              Habit
            </div>
            <div className="bg-[color:var(--bg-card)] px-3 py-3 text-center text-sm font-medium text-[color:var(--text-secondary)]">
              Streak / Freeze
            </div>
            {days.map((day) => (
              <div
                key={day.key}
                className="bg-[color:var(--bg-card)] px-2 py-3 text-center text-xs font-medium text-[color:var(--text-muted)]"
              >
                <div>{day.label}</div>
                <div className="mt-1 text-[10px] uppercase text-[color:var(--text-secondary)]">
                  {day.weekday}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[color:var(--border-subtle)]">
            {habits.map((habit, index) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                index={index}
                totalHabits={habits.length}
                days={days}
                todayKey={todayKey}
                completionSet={completionSet}
                onToggle={onToggle}
                onToggleFreeze={onToggleFreeze}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
