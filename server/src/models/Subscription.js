import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    nextRenewalDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
