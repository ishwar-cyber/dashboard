import mongoose from 'mongoose';

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} - True if valid ObjectId
 */
export const validateObjectId = (id) => {
    console.log('Validating ObjectId:', id);
    
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone number
 */
export const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate pincode (Indian format)
 * @param {string} pincode - Pincode to validate
 * @returns {boolean} - True if valid pincode
 */
export const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

/**
 * Validate price (positive number)
 * @param {number} price - Price to validate
 * @returns {boolean} - True if valid price
 */
export const validatePrice = (price) => {
    return typeof price === 'number' && price >= 0;
};

/**
 * Validate quantity (positive integer)
 * @param {number} quantity - Quantity to validate
 * @returns {boolean} - True if valid quantity
 */
export const validateQuantity = (quantity) => {
    return Number.isInteger(quantity) && quantity > 0;
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate order status
 * @param {string} status - Status to validate
 * @returns {boolean} - True if valid status
 */
export const validateOrderStatus = (status) => {
    const validStatuses = [
        'pending', 'confirmed', 'processing', 'shipped', 
        'out_for_delivery', 'delivered', 'cancelled', 'returned'
    ];
    return validStatuses.includes(status);
};

/**
 * Validate payment status
 * @param {string} status - Status to validate
 * @returns {boolean} - True if valid status
 */
export const validatePaymentStatus = (status) => {
    const validStatuses = [
        'pending', 'processing', 'completed', 'failed', 
        'refunded', 'partially_refunded'
    ];
    return validStatuses.includes(status);
};

/**
 * Validate payment method
 * @param {string} method - Method to validate
 * @returns {boolean} - True if valid method
 */
export const validatePaymentMethod = (method) => {
    const validMethods = [
        'cod', 'credit_card', 'debit_card', 'upi', 
        'net_banking', 'wallet'
    ];
    return validMethods.includes(method);
};

/**
 * Generate visitor ID
 * @returns {string} - Unique visitor ID
 */
// export const generateVisitorId = () => {
//     return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// };

/**
 * Validate shipping address
 * @param {object} address - Address object to validate
 * @returns {object} - Validation result
 */
export const validateShippingAddress = (address) => {
    const errors = [];
    
    if (!address.firstName || address.firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    
    if (!address.lastName || address.lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    
    if (!address.addressLine1 || address.addressLine1.trim().length < 10) {
        errors.push('Address line 1 must be at least 10 characters');
    }
    
    if (!address.city || address.city.trim().length < 2) {
        errors.push('City must be at least 2 characters');
    }
    
    if (!address.state || address.state.trim().length < 2) {
        errors.push('State must be at least 2 characters');
    }
    
    if (!validatePincode(address.pincode)) {
        errors.push('Invalid pincode format');
    }
    
    if (!validatePhone(address.phone)) {
        errors.push('Invalid phone number format');
    }
    
    if (!validateEmail(address.email)) {
        errors.push('Invalid email format');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculate order totals
 * @param {Array} items - Order items
 * @param {number} tax - Tax amount
 * @param {number} shipping - Shipping amount
 * @param {number} discount - Discount amount
 * @returns {object} - Calculated totals
 */
export const calculateOrderTotals = (items, tax = 0, shipping = 0, discount = 0) => {
    const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
    const total = subtotal + tax + shipping - discount;
    
    return {
        subtotal,
        tax,
        shipping,
        discount,
        total
    };
}; 