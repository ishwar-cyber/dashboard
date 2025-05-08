import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon Code is Required']
    },
    discount: {
        type: Number,
        required: [true, 'Discount is Required']
    },
    startDate:{
        type: Date,
        required: [true, 'Start Date is Required'],
        validate: {
            validator: function(value) {
                // Check if the date is valid
                return !isNaN(value) && value instanceof Date;
            },
            message: props => 'Start date must be a valid date in ISO format (YYYY-MM-DD) or ISO datetime format (YYYY-MM-DDTHH:mm:ss.sssZ)'
        }
    },
    expiryDate: {
        type: Date,
        // validate: {
        //     validator: function(value) {
        //         // Check if the date is valid
        //         return !isNaN(value) && value instanceof Date;
        //     },
        //     message: props => 'Expiry date must be a valid date in ISO format (YYYY-MM-DD) or ISO datetime format (YYYY-MM-DDTHH:mm:ss.sssZ)'
        // }
    },
    noExpiry:{
        type: Boolean,
        default: false
    },
    product: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is Required']
    }],
    discountType: {
        type: String,
        default: 'percentage'
    },
    applyTo: {
        type: String,
    },
}, { timestamps: true, toJSON: { virtuals: true } });
couponSchema.set('toJSON', { virtuals: true });

const Coupon = mongoose.model('coupons', couponSchema);

export default Coupon;