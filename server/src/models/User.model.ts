import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  // Settings embedded in user document
  settings: {
    dataRetentionMonths: number; // default: 12
    currency: string; // default: 'INR'
    theme: "light" | "dark" | "system"; // default: 'system'
    frequencyMap?: Record<string, Record<string, number>>;
  };
  // Token fields for refresh token rotation
  refreshTokens?: string[];
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    photoURL: { type: String },
    settings: {
      dataRetentionMonths: { type: Number, default: 12 },
      currency: { type: String, default: "INR" },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      frequencyMap: {
        type: Schema.Types.Mixed,
        default: {},
        validate: {
          validator: function (v: any) {
            if (!v || typeof v !== "object") return true;
            const keys = Object.keys(v);
            if (keys.length > 500) return false;
            if (JSON.stringify(v).length > 50000) return false;
            return true;
          },
          message: "Frequency map is too large or invalid",
        },
      },
    },
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: "Too many active refresh tokens",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", UserSchema);
