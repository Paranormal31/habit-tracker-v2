import { HabitCompletion } from "../models/HabitCompletion";
import { addDays } from "./date";

export async function recomputeStreak(params: {
  userId: string;
  habitId: string;
  today: string;
  freezeDate?: string | null;
}) {
  const completions = await HabitCompletion.find({
    userId: params.userId,
    habitId: params.habitId,
    completed: true
  }).select("date");

  const set = new Set(completions.map((c) => c.date));
  let streak = 0;
  let cursor = params.today;
  let skippedFreeze = false;

  while (true) {
    // Grace rule: missing today does not break streak until local day rollover.
    if (cursor === params.today && !set.has(cursor) && params.freezeDate !== cursor) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if (set.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    // Freeze protects exactly one missing day wherever it appears in the chain.
    if (!skippedFreeze && params.freezeDate && cursor === params.freezeDate) {
      skippedFreeze = true;
      cursor = addDays(cursor, -1);
      continue;
    }

    // Any other gap breaks the contiguous streak.
    break;
  }

  return streak;
}
