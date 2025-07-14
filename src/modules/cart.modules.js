import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [999, 'Quantity cannot exceed 999']
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
    }
}, { 
    timestamps: true,
    _id: true 
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false,
        index: true
    },
    visitorId: {
        type: String,
        required: true,
        index: true
    },
    items: [cartItemSchema],
    subtotal: {
        type: Number,
        default: 0,
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
    total: {
        type: Number,
        default: 0,
        min: [0, 'Total cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR']
    },
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
    collection: 'carts'
});

// Indexes for better performance
cartSchema.index({ visitorId: 1, isActive: 1 });
cartSchema.index({ userId: 1, isActive: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
    this.calculateTotals();
    next();
});

// Instance method to calculate totals
cartSchema.methods.calculateTotals = function() {
    this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
    this.total = this.subtotal + this.tax + this.shipping;
    return this;
};

// Instance method to add item
cartSchema.methods.addItem = function(productId, quantity, price, options = {}) {
    const existingItemIndex = this.items.findIndex(item => 
        item.product.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
        // Update existing item
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].totalPrice = this.items[existingItemIndex].quantity * price;
    } else {
        // Add new item
        this.items.push({
            product: productId,
            quantity,
            price,
            totalPrice: quantity * price,
            selectedOptions: options
        });
    }
    
    this.calculateTotals();
    return this;
};

// Instance method to remove item
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => 
        item.product.toString() !== productId.toString()
    );
    this.calculateTotals();
    return this;
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const item = this.items.find(item => 
        item.product.toString() === productId.toString()
    );
    
    if (item) {
        item.quantity = quantity;
        item.totalPrice = quantity * item.price;
        this.calculateTotals();
    }
    
    return this;
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.subtotal = 0;
    this.tax = 0;
    this.shipping = 0;
    this.total = 0;
    return this;
};

// Static method to find cart by visitor or user
cartSchema.statics.findByUser = function(userId, visitorId) {
    const query = { isActive: true };
    
    if (userId) {
        query.userId = userId;
    } else if (visitorId) {
        query.visitorId = visitorId;
    }
    
    return this.findOne(query);
};

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
