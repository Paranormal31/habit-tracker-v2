import { z } from "zod";

const habitTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format")
  .nullable();

export const createHabitSchema = z.object({
  name: z.string().min(1).max(80),
  time: habitTimeSchema.optional()
});

export const updateHabitSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    time: habitTimeSchema.optional()
  })
  .refine((data) => data.name !== undefined || data.time !== undefined, {
    message: "At least one field is required"
  });

export const reorderHabitsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});
