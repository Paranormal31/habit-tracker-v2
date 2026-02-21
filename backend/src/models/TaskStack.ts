import { Schema, model, Types } from "mongoose";

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

type TaskItem = {
  taskId: string;
  title: string;
  priority: TaskPriority;
  done: boolean;
};

const taskItemSchema = new Schema<TaskItem>(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: TASK_PRIORITIES, required: true, default: "medium" },
    done: { type: Boolean, required: true, default: false }
  },
  { _id: false }
);

const taskStackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    tasks: { type: [taskItemSchema], required: true, default: [] }
  },
  { timestamps: true }
);

taskStackSchema.index({ userId: 1, date: 1 }, { unique: true });

export type TaskStackDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  tasks: TaskItem[];
  createdAt: Date;
  updatedAt: Date;
};

export const TaskStack = model<TaskStackDoc>("TaskStack", taskStackSchema);
