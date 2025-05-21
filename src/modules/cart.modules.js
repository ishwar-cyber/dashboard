import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    visitorId: {
        type: String,
        required: true,
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    }],
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
