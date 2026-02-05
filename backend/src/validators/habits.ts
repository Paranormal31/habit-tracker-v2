import { z } from "zod";

export const createHabitSchema = z.object({
  name: z.string().min(1).max(80)
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(80)
});

export const reorderHabitsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});
