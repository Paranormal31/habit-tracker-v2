import { z } from "zod";

const timeBlockItemSchema = z.object({
  time: z.string().min(1),
  plan: z.string(),
  notes: z.string()
});

export const getTimeBlocksSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const upsertTimeBlocksSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocks: z.array(timeBlockItemSchema)
});
