import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Habit } from "../models/Habit";
import { HabitCompletion } from "../models/HabitCompletion";
import { getProgressSchema } from "../validators/completions";
import { parseMonth, daysInMonth } from "../utils/date";

export async function getProgressForMonth(req: AuthRequest, res: Response) {
  const data = getProgressSchema.parse(req.query);
  const { year, month } = parseMonth(data.month);
  const days = daysInMonth(year, month);

  const habitsCount = await Habit.countDocuments({ userId: req.userId });
  const totalChecks = habitsCount * days;

  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const completedChecks = await HabitCompletion.countDocuments({
    userId: req.userId,
    completed: true,
    date: { $regex: `^${prefix}` }
  });

  const percentage = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  return res.json({ totalChecks, completedChecks, percentage });
}
