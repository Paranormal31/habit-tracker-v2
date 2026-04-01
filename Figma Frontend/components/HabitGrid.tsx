import React from 'react';
import { HabitRow } from './HabitRow';
import type { Habit } from '../App';

interface HabitGridProps {
  habits: Habit[];
  currentDate: Date;
  daysInMonth: number;
  onToggleCompletion: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
  onMoveHabit: (index: number, direction: 'up' | 'down') => void;
  onUpdateHabitTime: (habitId: string, time: string) => void;
}

export function HabitGrid({
  habits,
  currentDate,
  daysInMonth,
  onToggleCompletion,
  onDeleteHabit,
  onMoveHabit,
  onUpdateHabitTime,
}: HabitGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = isCurrentMonth ? today.getDate() : -1;

  // Generate array of days for the month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="grid gap-px bg-zinc-800" style={{
            gridTemplateColumns: `minmax(200px, 1fr) 80px repeat(${daysInMonth}, 40px)`
          }}>
            <div className="bg-zinc-900 px-4 py-3 font-medium text-sm text-zinc-400">
              Habit
            </div>
            <div className="bg-zinc-900 px-3 py-3 font-medium text-sm text-zinc-400 text-center">
              Streak
            </div>
            {days.map(day => (
              <div
                key={day}
                className={`bg-zinc-900 px-2 py-3 font-medium text-xs text-center ${
                  day === currentDay ? 'text-teal-400' : 'text-zinc-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Habit Rows */}
          <div className="bg-zinc-800">
            {habits.map((habit, index) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                index={index}
                totalHabits={habits.length}
                year={year}
                month={month}
                days={days}
                currentDay={currentDay}
                onToggleCompletion={onToggleCompletion}
                onDelete={onDeleteHabit}
                onMove={onMoveHabit}
                onUpdateTime={onUpdateHabitTime}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-zinc-800">
        {habits.map((habit, index) => (
          <div key={habit.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-zinc-100">{habit.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">Streak:</span>
                  <span className="text-sm text-teal-400 font-semibold">
                    🔥 {calculateStreak(habit, year, month)}
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="time"
                    value={habit.time}
                    onChange={(e) => onUpdateHabitTime(habit.id, e.target.value)}
                    className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200"
                    aria-label={`Set time for ${habit.name}`}
                  />
                </div>
              </div>
              <button
                onClick={() => onDeleteHabit(habit.id)}
                className="text-zinc-500 hover:text-red-400 transition-colors p-2"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-2 min-w-max pb-2">
                {days.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isCompleted = habit.completedDates.has(dateStr);
                  const isToday = day === currentDay;

                  return (
                    <button
                      key={day}
                      onClick={() => onToggleCompletion(habit.id, dateStr)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
                        isCompleted
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : isToday
                          ? 'bg-zinc-800 border-teal-500/50 text-zinc-400'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-600 hover:border-zinc-600'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateStreak(habit: Habit, year: number, month: number): number {
  let streak = 0;
  const today = new Date();
  const currentDate = new Date(year, month, today.getDate());

  // Count backwards from today
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    
    if (habit.completedDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // Don't break on first day (today) if not completed
      break;
    }
  }

  return streak;
}
