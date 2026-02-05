import { HabitRow } from "./HabitRow";

type Habit = {
  id: string;
  name: string;
  order: number;
  streak: number;
  createdAt: string;
};

type HabitGridProps = {
  habits: Habit[];
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

export function HabitGrid({
  habits,
  days,
  year,
  month,
  todayKey,
  isTodayMonth,
  completionSet,
  onToggle,
  onDelete,
  onMove,
}: HabitGridProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)]">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div
            className="grid gap-px bg-[color:var(--border-subtle)]"
            style={{
              gridTemplateColumns: `minmax(220px, 1fr) 90px repeat(${days.length}, 40px)`,
            }}
          >
            <div className="bg-[color:var(--bg-card)] px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)]">
              Habit
            </div>
            <div className="bg-[color:var(--bg-card)] px-3 py-3 text-center text-sm font-medium text-[color:var(--text-secondary)]">
              Streak
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="bg-[color:var(--bg-card)] px-2 py-3 text-center text-xs font-medium text-[color:var(--text-muted)]"
              >
                {day}
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
                year={year}
                month={month}
                todayKey={todayKey}
                isTodayMonth={isTodayMonth}
                completionSet={completionSet}
                onToggle={onToggle}
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
