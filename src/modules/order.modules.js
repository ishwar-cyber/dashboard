import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative']
    },
    selectedOptions: {
        type: Map,
        of: String,
        default: new Map()
    },
    sku: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    }
}, { 
    timestamps: true,
    _id: true 
});

const shippingAddressSchema = new mongoose.Schema({
    addressLine1: {
        type: String,
        required: true,
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    orderItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cart',
        required: true,
        index: true
    }],
    
    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    shipping: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['USD', 'EUR', 'GBP', 'INR']
    },
    
    // Order Status
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
        default: 'pending',
        index: true
    },
    
    // Payment Information
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
        index: true
    },
    paymentId: {
        type: String,
        index: true
    },
    paymentGateway: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'cod']
    },
    
    // Shipping Information
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema,
    
    // Tracking
    trackingNumber: {
        type: String,
        index: true
    },
    courierName: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    
    // Timestamps
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Additional Information
    notes: {
        type: String,
        maxlength: 500
    },
    tags: [{
        type: String,
        enum: ['urgent', 'fragile', 'gift', 'bulk_order']
    }],
    
    // Analytics
    source: {
        type: String,
        enum: ['web', 'mobile_app', 'api'],
        default: 'web'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { 
    timestamps: true,
    collection: 'orders'
});

// Indexes for better performance
orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ orderStatus: 1, orderDate: -1 });
orderSchema.index({ paymentStatus: 1, orderDate: -1 });
orderSchema.index({ 'shippingAddress.email': 1 });
orderSchema.index({ 'shippingAddress.phone': 1 });

// Virtual for order summary
orderSchema.virtual('itemCount').get(function() {
    return this.orderItems.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual('isDelivered').get(function() {
    return this.orderStatus === 'delivered';
});

orderSchema.virtual('isCancelled').get(function() {
    return this.orderStatus === 'cancelled';
});

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
    if (this.isNew && !this.orderNumber) {
        this.orderNumber = this.generateOrderNumber();
    }
    next();
});

// Instance method to generate order number
orderSchema.methods.generateOrderNumber = function() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
    this.orderStatus = newStatus;
    this.statusUpdatedAt = new Date();
    if (notes) {
        this.notes = notes;
    }
    
    // Set deliveredAt if status is delivered
    if (newStatus === 'delivered') {
        this.deliveredAt = new Date();
    }
    
    return this;
};

// Instance method to calculate totals
orderSchema.methods.calculateTotals = function() {
    this.subtotal = this.orderItems.reduce((total, item) => total + item.totalPrice, 0);
    this.totalPrice = this.subtotal + this.tax + this.shipping - this.discount;
    return this;
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
    const query = { user: userId };
    
    if (options.status) {
        query.orderStatus = options.status;
    }
    
    if (options.paymentStatus) {
        query.paymentStatus = options.paymentStatus;
    }
    
    return this.find(query).sort({ orderDate: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStatistics = function(userId) {
    return this.aggregate([
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$totalPrice' },
                averageOrderValue: { $avg: '$totalPrice' },
                pendingOrders: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
                },
                deliveredOrders: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
                }
            }
        }
    ]);
};

// JSON transformation
orderSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;