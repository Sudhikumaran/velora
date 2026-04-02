import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: { type: String, enum: ["income", "expense"], required: true },
    name: { type: String, required: true, trim: true, maxlength: 64 },
    nameLower: { type: String, required: true },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, kind: 1, nameLower: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
