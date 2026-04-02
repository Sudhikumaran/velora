import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    carryOver: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, year: 1, month: 1, category: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
