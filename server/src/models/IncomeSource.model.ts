import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIncomeSource extends Document {
  userId: Types.ObjectId;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex string
  frequency: "monthly" | "weekly" | "biweekly" | "irregular";
  expectedAmount?: number;
  isDefault: boolean; // NEW: flag default sources
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSourceSchema = new Schema<IIncomeSource>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    frequency: {
      type: String,
      enum: ["monthly", "weekly", "biweekly", "irregular"],
      required: true,
    },
    expectedAmount: { type: Number, min: 0 },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 999 },
  },
  { timestamps: true },
);

export default mongoose.model<IIncomeSource>(
  "IncomeSource",
  IncomeSourceSchema,
);
