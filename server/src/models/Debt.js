import mongoose from "mongoose";

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    originalAmount: { type: Number },
    type: { type: String, enum: ["you_gave", "you_owe"], required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    date: { type: Date, default: Date.now },
    reminderAt: { type: Date },
    paymentHistory: [paymentEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Debt", debtSchema);
