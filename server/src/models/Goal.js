import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    targetAmount: { type: Number, required: true, min: 0 },
    savedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    active: { type: Boolean, default: true },
    color: { type: String, maxlength: 32 },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
