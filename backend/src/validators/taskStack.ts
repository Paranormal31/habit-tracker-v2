import { z } from "zod";
import { TASK_PRIORITIES } from "../models/TaskStack";

const taskItemSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  priority: z.enum(TASK_PRIORITIES),
  done: z.boolean()
});

export const getTaskStackSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const upsertTaskStackSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tasks: z.array(taskItemSchema)
});
