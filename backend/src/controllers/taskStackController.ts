import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { TaskStack } from "../models/TaskStack";
import { isValidDateString } from "../utils/date";
import { getTaskStackSchema, upsertTaskStackSchema } from "../validators/taskStack";

export async function getTaskStack(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = getTaskStackSchema.parse(req.query);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const existing = await TaskStack.findOne({ userId: req.userId, date: data.date });
  if (!existing) {
    return res.json({ date: data.date, tasks: [] });
  }

  return res.json({ date: existing.date, tasks: existing.tasks });
}

export async function upsertTaskStack(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = upsertTaskStackSchema.parse(req.body);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const saved = await TaskStack.findOneAndUpdate(
    { userId: req.userId, date: data.date },
    {
      $set: {
        tasks: data.tasks
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  return res.json({
    date: saved?.date ?? data.date,
    tasks: saved?.tasks ?? data.tasks
  });
}
