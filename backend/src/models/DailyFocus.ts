import { Schema, model, Types } from "mongoose";

export const DAILY_FOCUS_LABELS = ["primary", "secondary", "tertiary"] as const;
export type DailyFocusLabel = (typeof DAILY_FOCUS_LABELS)[number];

type DailyFocusItem = {
  label: DailyFocusLabel;
  text: string;
  done: boolean;
};

const dailyFocusItemSchema = new Schema<DailyFocusItem>(
  {
    label: {
      type: String,
      enum: DAILY_FOCUS_LABELS,
      required: true
    },
    text: { type: String, required: true, trim: true, default: "" },
    done: { type: Boolean, required: true, default: false }
  },
  { _id: false }
);

const dailyFocusSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    items: { type: [dailyFocusItemSchema], required: true, default: [] }
  },
  { timestamps: true }
);

dailyFocusSchema.index({ userId: 1, date: 1 }, { unique: true });

export type DailyFocusDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  items: DailyFocusItem[];
  createdAt: Date;
  updatedAt: Date;
};

export const DailyFocus = model<DailyFocusDoc>("DailyFocus", dailyFocusSchema);
