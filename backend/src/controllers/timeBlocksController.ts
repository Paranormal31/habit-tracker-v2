import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { TimeBlock } from "../models/TimeBlock";
import { isValidDateString } from "../utils/date";
import { getTimeBlocksSchema, upsertTimeBlocksSchema } from "../validators/timeBlocks";

type TimeBlockItemPayload = {
  time: string;
  plan: string;
  notes: string;
};

function normalizeBlocks(blocks: TimeBlockItemPayload[]): TimeBlockItemPayload[] {
  return blocks.map((block) => ({
    time: block.time.trim(),
    plan: (block.plan ?? "").trim(),
    notes: (block.notes ?? "").trim()
  }));
}

export async function getTimeBlocks(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = getTimeBlocksSchema.parse(req.query);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const existing = await TimeBlock.findOne({ userId: req.userId, date: data.date });
  if (!existing) {
    return res.json({ date: data.date, blocks: [] });
  }

  return res.json({ date: existing.date, blocks: normalizeBlocks(existing.blocks) });
}

export async function upsertTimeBlocks(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = upsertTimeBlocksSchema.parse(req.body);
  if (!isValidDateString(data.date)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const normalizedBlocks = normalizeBlocks(data.blocks);
  const saved = await TimeBlock.findOneAndUpdate(
    { userId: req.userId, date: data.date },
    {
      $set: {
        blocks: normalizedBlocks
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
    blocks: saved ? normalizeBlocks(saved.blocks) : normalizedBlocks
  });
}
