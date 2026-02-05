import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Habit } from "../models/Habit";
import { HabitCompletion } from "../models/HabitCompletion";
import { getCompletionsSchema, toggleCompletionSchema } from "../validators/completions";
import { getTodayInTimezone, isValidDateString, addDays, parseMonth } from "../utils/date";
import { recomputeStreak } from "../utils/streak";

export async function getCompletionsForMonth(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = getCompletionsSchema.parse(req.query);
  const { year, month } = parseMonth(data.month);
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;

  const completions = await HabitCompletion.find({
    userId: req.userId,
    date: { $regex: `^${prefix}` },
    completed: true
  });

  return res.json(
    completions.map((c) => ({
      habitId: c.habitId,
      date: c.date,
      completed: c.completed
    }))
  );
}

export async function toggleCompletion(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = toggleCompletionSchema.parse(req.body);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const habit = await Habit.findOne({ _id: data.habitId, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  const existing = await HabitCompletion.findOne({
    userId: req.userId,
    habitId: data.habitId,
    date: data.date
  });

  let completed = true;
  if (!existing) {
    await HabitCompletion.create({
      userId: req.userId,
      habitId: data.habitId,
      date: data.date,
      completed: true
    });
  } else {
    completed = !existing.completed;
    existing.completed = completed;
    await existing.save();
  }

  const today = await getTodayInTimezone(req.userId);
  if (habit.streakFreezeDate && habit.streakFreezeDate !== today) {
    habit.streakFreezeDate = null;
  }
  const streak = await recomputeStreak({
    userId: req.userId,
    habitId: data.habitId,
    today,
    freezeDate: habit.streakFreezeDate ?? null
  });

  habit.streak = streak;
  await habit.save();

  return res.json({
    habitId: data.habitId,
    date: data.date,
    completed,
    streak
  });
}
