import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PlannerNote } from "../models/PlannerNote";
import { isValidDateString } from "../utils/date";
import { getPlannerNoteSchema, upsertPlannerNoteSchema } from "../validators/plannerNotes";

export async function getPlannerNote(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = getPlannerNoteSchema.parse(req.query);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const existing = await PlannerNote.findOne({ userId: req.userId, date: data.date });
  if (!existing) {
    return res.json({ date: data.date, content: "" });
  }

  return res.json({ date: existing.date, content: existing.content });
}

export async function upsertPlannerNote(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = upsertPlannerNoteSchema.parse(req.body);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const saved = await PlannerNote.findOneAndUpdate(
    { userId: req.userId, date: data.date },
    {
      $set: {
        content: data.content
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
    content: saved?.content ?? data.content
  });
}
