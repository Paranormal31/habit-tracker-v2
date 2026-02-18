import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { DailyFocus, DailyFocusLabel, DAILY_FOCUS_LABELS } from "../models/DailyFocus";
import { isValidDateString } from "../utils/date";
import { getDailyFocusSchema, upsertDailyFocusSchema } from "../validators/dailyFocus";

type DailyFocusItemPayload = {
  label: DailyFocusLabel;
  text: string;
  done: boolean;
};

const labelOrder: Record<DailyFocusLabel, number> = {
  primary: 0,
  secondary: 1,
  tertiary: 2
};

function getDefaultItems(): DailyFocusItemPayload[] {
  return DAILY_FOCUS_LABELS.map((label) => ({ label, text: "", done: false }));
}

function normalizeItems(items: DailyFocusItemPayload[]): DailyFocusItemPayload[] {
  return [...items]
    .map((item) => ({
      label: item.label,
      text: item.text.trim(),
      done: item.done
    }))
    .sort((a, b) => labelOrder[a.label] - labelOrder[b.label]);
}

export async function getDailyFocus(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = getDailyFocusSchema.parse(req.query);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const existing = await DailyFocus.findOne({ userId: req.userId, date: data.date });
  if (!existing) {
    return res.json({ date: data.date, items: getDefaultItems() });
  }

  return res.json({ date: existing.date, items: normalizeItems(existing.items) });
}

export async function upsertDailyFocus(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = upsertDailyFocusSchema.parse(req.body);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const normalizedItems = normalizeItems(data.items);
  const saved = await DailyFocus.findOneAndUpdate(
    { userId: req.userId, date: data.date },
    {
      $set: {
        items: normalizedItems
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
    items: saved ? normalizeItems(saved.items) : normalizedItems
  });
}
