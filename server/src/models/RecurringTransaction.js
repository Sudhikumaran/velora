import mongoose from "mongoose";

const recurringSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "uncategorized", trim: true },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    dayOfMonth: { type: Number, min: 1, max: 28 },
    note: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    nextDueAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("RecurringTransaction", recurringSchema);
