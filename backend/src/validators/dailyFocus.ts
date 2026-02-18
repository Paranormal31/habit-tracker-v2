import { z } from "zod";
import { DAILY_FOCUS_LABELS } from "../models/DailyFocus";

const dailyFocusLabelSchema = z.enum(DAILY_FOCUS_LABELS);

const dailyFocusItemSchema = z.object({
  label: dailyFocusLabelSchema,
  text: z.string(),
  done: z.boolean()
});

export const getDailyFocusSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const upsertDailyFocusSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(dailyFocusItemSchema)
    .length(3)
    .superRefine((items, ctx) => {
      const labels = new Set(items.map((item) => item.label));
      for (const label of DAILY_FOCUS_LABELS) {
        if (!labels.has(label)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing label: ${label}`
          });
        }
      }
    })
});
