import mongoose from "mongoose";
const Schema = mongoose.Schema;
const CartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // should match the model name
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [999, 'Quantity cannot exceed 999']
    },
    variantId: {
        type: Schema.Types.ObjectId,
    }
}, { 
    timestamps: true,
    _id: true 
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    visitorId: {
        type: String,
        index: true
    },
    items: [CartItemSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
    return this.items.length;
});

cartSchema.virtual('subTotal').get(function() {
   return this.items.reduce((total, item) => {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        return total + (discountedPrice * item.quantity);
    }, 0);
});

// // Virtual for total discount
// cartSchema.virtual('totalDiscount').get(function() {
//     return this.items.reduce((total, item) => {
//         const itemDiscount = item.price * (item.discount || 0) / 100 * item.quantity;
//         return total + itemDiscount;
//     }, 0);
// });

// // Virtual for total price of each item
CartItemSchema.virtual('total').get(function() {
    return this.subTotal;
});

// JSON transformation
cartSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
