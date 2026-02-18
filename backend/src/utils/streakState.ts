import { HydratedDocument } from "mongoose";
import { HabitDoc } from "../models/Habit";
import { recomputeStreak } from "./streak";

type RecomputeAndNormalizeParams = {
  habit: HydratedDocument<HabitDoc>;
  userId: string;
  today: string;
};

export async function recomputeAndNormalizeHabitStreak(params: RecomputeAndNormalizeParams) {
  const freezeDate = params.habit.streakFreezeDate ?? null;
  const streak = await recomputeStreak({
    userId: params.userId,
    habitId: params.habit._id.toString(),
    today: params.today,
    freezeDate
  });

  // Freeze is single-day protection: keep only if it is still for today.
  const normalizedFreezeDate = freezeDate === params.today ? freezeDate : null;
  const changed =
    params.habit.streak !== streak ||
    (params.habit.streakFreezeDate ?? null) !== normalizedFreezeDate;

  params.habit.streak = streak;
  params.habit.streakFreezeDate = normalizedFreezeDate;

  if (changed) {
    await params.habit.save();
  }

  return {
    streak,
    streakFreezeDate: normalizedFreezeDate,
    changed
  };
}
