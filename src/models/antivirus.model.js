import mongoose from "mongoose";
const Schema = mongoose.Schema;

const AntivirusKeySchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    key: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["available", "sold", "invalid"],
      default: "available",
      index: true
    },
    soldTo: {
      type: String, // store email or userId (string)
      default: null
    },
    soldAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// optional compound index for faster product queries
AntivirusKeySchema.index({ productId: 1, status: 1 });

export default mongoose.model("AntivirusKey", AntivirusKeySchema);
