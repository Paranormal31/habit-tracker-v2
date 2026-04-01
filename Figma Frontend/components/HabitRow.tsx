import React from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Habit } from '../App';

interface HabitRowProps {
  habit: Habit;
  index: number;
  totalHabits: number;
  year: number;
  month: number;
  days: number[];
  currentDay: number;
  onToggleCompletion: (habitId: string, dateStr: string) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onUpdateTime: (habitId: string, time: string) => void;
}

export function HabitRow({
  habit,
  index,
  totalHabits,
  year,
  month,
  days,
  currentDay,
  onToggleCompletion,
  onDelete,
  onMove,
  onUpdateTime,
}: HabitRowProps) {
  const streak = calculateStreak(habit, year, month);

  return (
    <div
      className="grid gap-px bg-zinc-800 hover:bg-zinc-750 transition-colors group"
      style={{
        gridTemplateColumns: `minmax(200px, 1fr) 80px repeat(${days.length}, 40px)`
      }}
    >
      {/* Habit Name Cell */}
      <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between gap-3 group-hover:bg-zinc-850">
        <div className="min-w-0">
          <div className="text-sm text-zinc-100 font-medium truncate">{habit.name}</div>
          <input
            type="time"
            value={habit.time}
            onChange={(e) => onUpdateTime(habit.id, e.target.value)}
            className="mt-2 h-7 w-[130px] rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200"
            aria-label={`Set time for ${habit.name}`}
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={index === totalHabits - 1}
            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-1 hover:bg-red-950/50 rounded ml-1"
            aria-label="Delete habit"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Streak Cell */}
      <div className="bg-zinc-900 px-3 py-3 flex items-center justify-center group-hover:bg-zinc-850">
        <span className={`text-sm font-semibold ${
          streak > 0 ? 'text-teal-400' : 'text-zinc-600'
        }`}>
          {streak > 0 && '🔥'} {streak}
        </span>
      </div>

      {/* Day Cells */}
      {days.map(day => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isCompleted = habit.completedDates.has(dateStr);
        const isToday = day === currentDay;

        return (
          <div
            key={day}
            className="bg-zinc-900 p-1.5 flex items-center justify-center group-hover:bg-zinc-850"
          >
            <button
              onClick={() => onToggleCompletion(habit.id, dateStr)}
              className={`w-full h-full rounded transition-all ${
                isCompleted
                  ? 'bg-teal-600 hover:bg-teal-500'
                  : isToday
                  ? 'bg-zinc-800 border-2 border-teal-500/30 hover:border-teal-500/50'
                  : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-800'
              }`}
              aria-label={`Toggle ${habit.name} for day ${day}`}
            >
              {isCompleted && (
                <svg
                  className="w-4 h-4 mx-auto text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>
        );
      })}
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
