import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICategory extends Document {
  userId: Types.ObjectId;
  label: string;
  color: string; // Tailwind class OR hex string
  icon?: string; // Lucide icon name
  type: "default" | "custom";
  isArchived: boolean; // Soft delete — never set to true in hard delete
  order?: number; // For stable sort order
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    color: { type: String, required: true },
    icon: { type: String },
    type: { type: String, enum: ["default", "custom"], required: true },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 999 },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, isArchived: 1 });
CategorySchema.index(
  { userId: 1, label: 1 },
  { unique: true, partialFilterExpression: { isArchived: false } },
);

export default mongoose.model<ICategory>("Category", CategorySchema);
