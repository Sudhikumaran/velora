import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["expense", "income", "transfer"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "uncategorized", trim: true },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "", trim: true },
    isRecurringInstance: { type: Boolean, default: false },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringTransaction",
    },
    deletedAt: { type: Date, default: null, index: true },
    tags: [{ type: String, trim: true, maxlength: 48 }],
    taxYear: { type: Number, min: 2000, max: 2100 },
    attachments: [
      {
        name: { type: String, maxlength: 200 },
        url: { type: String, maxlength: 2000 },
      },
    ],
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model("Transaction", transactionSchema);
