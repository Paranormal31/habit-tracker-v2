import { Schema, model, Types } from "mongoose";

const completionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    date: { type: String, required: true },
    completed: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

completionSchema.index({ habitId: 1, date: 1 }, { unique: true });
completionSchema.index({ userId: 1, habitId: 1, date: 1 });

export type HabitCompletionDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  date: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const HabitCompletion = model<HabitCompletionDoc>("HabitCompletion", completionSchema);
