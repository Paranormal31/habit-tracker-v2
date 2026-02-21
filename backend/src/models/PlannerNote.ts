import { Schema, model, Types } from "mongoose";

const plannerNoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    content: { type: String, required: true, default: "" }
  },
  { timestamps: true }
);

plannerNoteSchema.index({ userId: 1, date: 1 }, { unique: true });

export type PlannerNoteDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export const PlannerNote = model<PlannerNoteDoc>("PlannerNote", plannerNoteSchema);
