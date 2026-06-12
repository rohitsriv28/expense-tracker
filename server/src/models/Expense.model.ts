import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  userId: Types.ObjectId;
  amount: number;
  remarks: string;
  date: Date;
  /**
   * This field stores the human-readable category label string (e.g. "Food")
   * NOT a MongoDB ObjectId reference.
   * This is intentional: preserves expense readability if a category is later renamed or archived.
   * Use dataMappers.resolveExpenseVisuals() to resolve full category object.
   */
  category?: string; // LABEL string — matches original Firestore field type
  editCount: number;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01, max: 10_000_000 },
    remarks: { type: String, required: true, maxlength: 500, trim: true },
    date: { type: Date, required: true, index: true },
    category: { type: String, trim: true },
    editCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    notes: { type: String, maxlength: 2000, trim: true },
  },
  { timestamps: true },
);

// Compound indexes for query patterns matching Firestore composite indexes
ExpenseSchema.index({ userId: 1, date: -1 }); // main listing
ExpenseSchema.index({ userId: 1, category: 1, date: -1 }); // category filter
ExpenseSchema.index({ userId: 1, date: 1 }); // retention query

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
