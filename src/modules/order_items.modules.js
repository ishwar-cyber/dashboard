import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products',
      required: true
  },
  quantity:{
      type: Number,
      required: true
  },
  visitorId:{
      type: String,
      required: true
  }
}, { timestamps: true });


const OrderItem = mongoose.model('cart', orderItemSchema);

export default OrderItem;