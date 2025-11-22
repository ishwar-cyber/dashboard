import mongoose from "mongoose";

const ProductReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",      // Make sure model name = "Product"
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatically stored
  }
);

export default mongoose.model("ProductReview", ProductReviewSchema);
