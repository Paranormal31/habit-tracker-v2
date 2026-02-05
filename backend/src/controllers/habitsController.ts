import { Request, Response } from "express";
import { Habit } from "../models/Habit";
import { HabitCompletion } from "../models/HabitCompletion";
import { AuthRequest } from "../middleware/auth";
import { createHabitSchema, updateHabitSchema, reorderHabitsSchema } from "../validators/habits";
import { getTodayInTimezone } from "../utils/date";
import { recomputeStreak } from "../utils/streak";

export async function listHabits(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const today = await getTodayInTimezone(req.userId);
  const habits = await Habit.find({ userId: req.userId }).sort({ order: 1 });
  for (const habit of habits) {
    if (habit.streakFreezeDate && habit.streakFreezeDate !== today) {
      habit.streakFreezeDate = null;
      const streak = await recomputeStreak({
        userId: req.userId,
        habitId: habit._id.toString(),
        today,
        freezeDate: null
      });
      habit.streak = streak;
      await habit.save();
    }
  }
  return res.json(
    habits.map((h) => ({
      id: h._id,
      name: h.name,
      order: h.order,
      streak: h.streak,
      streakFreezeDate: h.streakFreezeDate ?? null,
      isFrozenToday: h.streakFreezeDate === today,
      createdAt: h.createdAt
    }))
  );
}

export async function createHabit(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = createHabitSchema.parse(req.body);
  const last = await Habit.findOne({ userId: req.userId }).sort({ order: -1 });
  const order = last ? last.order + 1 : 0;

  const habit = await Habit.create({
    userId: req.userId,
    name: data.name.trim(),
    order,
    streak: 0
  });

  const today = await getTodayInTimezone(req.userId);
  return res.status(201).json({
    id: habit._id,
    name: habit.name,
    order: habit.order,
    streak: habit.streak,
    streakFreezeDate: habit.streakFreezeDate ?? null,
    isFrozenToday: habit.streakFreezeDate === today,
    createdAt: habit.createdAt
  });
}

export async function updateHabit(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = updateHabitSchema.parse(req.body);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  habit.name = data.name.trim();
  await habit.save();

  const today = await getTodayInTimezone(req.userId);
  return res.json({
    id: habit._id,
    name: habit.name,
    order: habit.order,
    streak: habit.streak,
    streakFreezeDate: habit.streakFreezeDate ?? null,
    isFrozenToday: habit.streakFreezeDate === today,
    createdAt: habit.createdAt
  });
}

export async function deleteHabit(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  await HabitCompletion.deleteMany({ habitId: habit._id, userId: req.userId });
  return res.json({ ok: true });
}

export async function reorderHabits(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = reorderHabitsSchema.parse(req.body);

  const habits = await Habit.find({ userId: req.userId, _id: { $in: data.orderedIds } });
  if (habits.length !== data.orderedIds.length) {
    return res.status(400).json({ message: "Invalid habit list" });
  }

  const bulk = data.orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, userId: req.userId },
      update: { $set: { order: index } }
    }
  }));

  if (bulk.length > 0) {
    await Habit.bulkWrite(bulk);
  }

  return res.json({ ok: true });
}

export async function toggleStreakFreeze(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  const today = await getTodayInTimezone(req.userId);
  if (habit.streakFreezeDate && habit.streakFreezeDate !== today) {
    habit.streakFreezeDate = null;
  }

  const completedToday = await HabitCompletion.findOne({
    userId: req.userId,
    habitId: habit._id,
    date: today,
    completed: true
  }).select("_id");

  if (completedToday && habit.streakFreezeDate !== today) {
    return res.status(400).json({ message: "Habit already completed today" });
  }

  const alreadyFrozenToday = habit.streakFreezeDate === today;
  habit.streakFreezeDate = alreadyFrozenToday ? null : today;

  const streak = await recomputeStreak({
    userId: req.userId,
    habitId: habit._id.toString(),
    today,
    freezeDate: habit.streakFreezeDate ?? null
  });

  habit.streak = streak;
  await habit.save();

  return res.json({
    habitId: habit._id.toString(),
    streak,
    streakFreezeDate: habit.streakFreezeDate ?? null,
    isFrozenToday: habit.streakFreezeDate === today
  });
}
