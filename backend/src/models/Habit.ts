import { Schema, model, Types } from "mongoose";

const habitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    streak: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, order: 1 });

export type HabitDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  order: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
};

export const Habit = model<HabitDoc>("Habit", habitSchema);
