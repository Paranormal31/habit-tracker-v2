import { Schema, model, Types } from "mongoose";

type TimeBlockItem = {
  time: string;
  plan: string;
  notes: string;
};

const timeBlockItemSchema = new Schema<TimeBlockItem>(
  {
    time: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true, default: "" },
    notes: { type: String, required: true, trim: true, default: "" }
  },
  { _id: false }
);

const timeBlockSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    blocks: { type: [timeBlockItemSchema], required: true, default: [] }
  },
  { timestamps: true }
);

timeBlockSchema.index({ userId: 1, date: 1 }, { unique: true });

export type TimeBlockDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  blocks: TimeBlockItem[];
  createdAt: Date;
  updatedAt: Date;
};

export const TimeBlock = model<TimeBlockDoc>("TimeBlock", timeBlockSchema);
