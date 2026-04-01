import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { AddHabit } from './components/AddHabit';
import { ProgressCard } from './components/ProgressCard';
import { MonthNavigation } from './components/MonthNavigation';
import { HabitGrid } from './components/HabitGrid';
import { EmptyState } from './components/EmptyState';

export interface Habit {
  id: string;
  name: string;
  time: string;
  completedDates: Set<string>; // Set of date strings in format 'YYYY-MM-DD'
  createdAt: Date;
}

function App() {
  // Initialize with some example habits to showcase the UI
  const [habits, setHabits] = useState<Habit[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Create some sample habits with varying completion patterns
    const sampleHabits: Habit[] = [
      {
        id: '1',
        name: 'Morning Meditation',
        time: '07:00',
        completedDates: new Set([
          `${year}-${String(month + 1).padStart(2, '0')}-01`,
          `${year}-${String(month + 1).padStart(2, '0')}-02`,
          `${year}-${String(month + 1).padStart(2, '0')}-03`,
          `${year}-${String(month + 1).padStart(2, '0')}-04`,
        ]),
        createdAt: new Date(year, month, 1),
      },
      {
        id: '2',
        name: 'Gym Workout',
        time: '18:00',
        completedDates: new Set([
          `${year}-${String(month + 1).padStart(2, '0')}-01`,
          `${year}-${String(month + 1).padStart(2, '0')}-03`,
        ]),
        createdAt: new Date(year, month, 1),
      },
      {
        id: '3',
        name: 'Read 30 Minutes',
        time: '21:00',
        completedDates: new Set([
          `${year}-${String(month + 1).padStart(2, '0')}-01`,
          `${year}-${String(month + 1).padStart(2, '0')}-02`,
        ]),
        createdAt: new Date(year, month, 1),
      },
    ];
    
    return sampleHabits;
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const userName = "Alex"; // Mock user name

  // Calculate days in current month
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  // Calculate total possible checks and completed checks for current month
  const { totalChecks, completedChecks } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let completed = 0;
    let total = 0;

    habits.forEach(habit => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        total++;
        if (habit.completedDates.has(dateStr)) {
          completed++;
        }
      }
    });

    return { totalChecks: total, completedChecks: completed };
  }, [habits, currentDate, daysInMonth]);

  const completionPercentage = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      time: '',
      completedDates: new Set(),
      createdAt: new Date(),
    };
    setHabits([...habits, newHabit]);
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const toggleCompletion = (habitId: string, dateStr: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDates = new Set(habit.completedDates);
        if (newCompletedDates.has(dateStr)) {
          newCompletedDates.delete(dateStr);
        } else {
          newCompletedDates.add(dateStr);
        }
        return { ...habit, completedDates: newCompletedDates };
      }
      return habit;
    }));
  };

  const updateHabitTime = (habitId: string, time: string) => {
    setHabits(habits.map(habit => (habit.id === habitId ? { ...habit, time } : habit)));
  };

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newHabits = [...habits];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newHabits.length) return;
    
    [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
    setHabits(newHabits);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header userName={userName} currentDate={new Date()} />
      
      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        <div className="space-y-6">
          <AddHabit onAdd={addHabit} />
          
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <ProgressCard
              percentage={completionPercentage}
              completed={completedChecks}
              total={totalChecks}
            />
            
            <div className="flex-1 w-full">
              <MonthNavigation
                currentDate={currentDate}
                onPrevious={() => changeMonth('prev')}
                onNext={() => changeMonth('next')}
              />
            </div>
          </div>

          {habits.length === 0 ? (
            <EmptyState />
          ) : (
            <HabitGrid
              habits={habits}
              currentDate={currentDate}
              daysInMonth={daysInMonth}
              onToggleCompletion={toggleCompletion}
              onDeleteHabit={deleteHabit}
              onMoveHabit={moveHabit}
              onUpdateHabitTime={updateHabitTime}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
