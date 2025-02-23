import mongoose, { VirtualType } from "mongoose";

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    orderItems:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    }],
    totalPrice:{
        type: Number,
        required: true
    },
    orderStatus:{
        type: String,
        default: 'pending'
    },  
    paymentType:{
        type: String,
        required: true
    },
    paymentStatus:{
        type: String,
        default: 'pending'
    },
    paymentId:{
        type: String,
    },
    addressLine1:{
        type: String,
        required: true
    },
    addressLine2:{
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    },
    state:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    dateOrdered:{
        type: Date,
        default: Date.now,
    }
},{timestamps: true});

orderSchema.set('toJSON', { virtuals: true });
 const Order = mongoose.model('orders', orderSchema);

 export default Order;