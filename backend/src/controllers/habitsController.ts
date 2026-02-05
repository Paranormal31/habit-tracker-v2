import { Request, Response } from "express";
import { Habit } from "../models/Habit";
import { HabitCompletion } from "../models/HabitCompletion";
import { AuthRequest } from "../middleware/auth";
import { createHabitSchema, updateHabitSchema, reorderHabitsSchema } from "../validators/habits";

export async function listHabits(req: AuthRequest, res: Response) {
  const habits = await Habit.find({ userId: req.userId }).sort({ order: 1 });
  return res.json(
    habits.map((h) => ({
      id: h._id,
      name: h.name,
      order: h.order,
      streak: h.streak,
      createdAt: h.createdAt
    }))
  );
}

export async function createHabit(req: AuthRequest, res: Response) {
  const data = createHabitSchema.parse(req.body);
  const last = await Habit.findOne({ userId: req.userId }).sort({ order: -1 });
  const order = last ? last.order + 1 : 0;

  const habit = await Habit.create({
    userId: req.userId,
    name: data.name.trim(),
    order,
    streak: 0
  });

  return res.status(201).json({
    id: habit._id,
    name: habit.name,
    order: habit.order,
    streak: habit.streak,
    createdAt: habit.createdAt
  });
}

export async function updateHabit(req: AuthRequest, res: Response) {
  const data = updateHabitSchema.parse(req.body);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  habit.name = data.name.trim();
  await habit.save();

  return res.json({
    id: habit._id,
    name: habit.name,
    order: habit.order,
    streak: habit.streak,
    createdAt: habit.createdAt
  });
}

export async function deleteHabit(req: AuthRequest, res: Response) {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  await HabitCompletion.deleteMany({ habitId: habit._id, userId: req.userId });
  return res.json({ ok: true });
}

export async function reorderHabits(req: AuthRequest, res: Response) {
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
