import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIncome extends Document {
  userId: Types.ObjectId;
  amount: number;
  source: string;
  sourceId?: Types.ObjectId;
  date: Date;
  description?: string;
  isRecurring: boolean;
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    source: { type: String, required: true, trim: true },
    sourceId: { type: Schema.Types.ObjectId, ref: "IncomeSource" },
    date: { type: Date, required: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
    },
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true },
);

IncomeSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IIncome>("Income", IncomeSchema);
