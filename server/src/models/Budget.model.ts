import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBudget extends Document {
  userId: Types.ObjectId;
  type: "monthly_envelope";
  name: string;
  amount: number;
  month: number; // 0-indexed (Jan=0, Dec=11)
  year: number;
  allocations: Map<string, number>; // categoryId → allocatedAmount
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["monthly_envelope"], required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 0, max: 11 },
    year: { type: Number, required: true },
    allocations: { type: Map, of: Number, default: new Map() },
  },
  { timestamps: true },
);

BudgetSchema.index({ userId: 1, year: -1, month: -1 });
BudgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IBudget>("Budget", BudgetSchema);
