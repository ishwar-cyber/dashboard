// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    phone: String
  },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  orderStatus: { type: String, default: "pending" }, // pending, processing, shipped, delivered
  totalAmount: Number
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model("Order", orderSchema);
