// models/Order.js
import mongoose from "mongoose";

const trackingStepSchema = new mongoose.Schema({
  key: { type: String, required: true },       // created | packed | shipped | delivered
  label: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: String,
      price: Number,
      quantity: Number,
      image: [{ type: String }],
    }
  ],
  shippingAddress: {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    landMark: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    phone: String
  },
  tracking: {
    type: [trackingStepSchema],
    default: [
      { key: 'placed', label: 'Order Placed', completed: true },
      { key: 'confirmed', label: 'Confirmed', completed: false },
      { key: 'shipped', label: 'Shipped', completed: false },
      { key: 'delivered', label: 'Delivered', completed: false },
      { key: 'cancelled', label: 'Cancelled', completed: false }
    ]
  },
  cashfreeOrderId: {type: String, required: true},
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  orderStatus: { type: String, default: "placed" },
  cancelReason: { type: String },
  totalAmount: { type: Number, required: true },
  // NEW FIELD
  refund: {
    amount: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    refundedAt: { type: Date, default: null },
    cashfreeRefundId: { type: String, default: null }
  }

}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model("Order", orderSchema);
