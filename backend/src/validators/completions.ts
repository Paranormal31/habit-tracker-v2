import { z } from "zod";

export const getCompletionsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/)
});

export const toggleCompletionSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const getProgressSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/)
});
