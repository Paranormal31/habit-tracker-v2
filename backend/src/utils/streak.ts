import { HabitCompletion } from "../models/HabitCompletion";
import { addDays } from "./date";

export async function recomputeStreak(params: { userId: string; habitId: string; today: string }) {
  const completions = await HabitCompletion.find({
    userId: params.userId,
    habitId: params.habitId,
    completed: true
  }).select("date");

  const set = new Set(completions.map((c) => c.date));
  let streak = 0;
  let cursor = params.today;

  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
