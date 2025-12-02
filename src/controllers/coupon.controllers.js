import Coupon from '../models/coupon.model.js';  // Fix the path to match your project structure
import Cart from '../models/cart.model.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
export const createCoupon = async (req, res) => {
    try {
        const { code, discount, product,noExpiry, applyto, discountType, startDate, expiryDate } = req.body;
        const coupon = new Coupon({
            code,
            discount,
            product, 
            noExpiry, 
            applyto, 
            discountType,
            startDate,
            expiryDate
        });
        await coupon.save();
        res.status(200).json({
            success: true,
            message: "Coupon created successfully",
            data: coupon
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getCoupons = async (req, res) => {
    try {
        let coupons = await Coupon.find();
        res.status(200).json({
            success: true,
            message: "Coupons fetched successfully",
            data: coupons
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.params.code, isActive: true });
        
        if (!coupon) {
             return res.status(404).json({ error: 'Coupon not found or expired' });
        }
        res.status(200).json({
            success: true,
            message: "Coupons fetched successfully",
            data: coupons
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getCouponByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await Coupon.findOne({ code: code });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Coupon fetched successfully",
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        let coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            const error = new Error('Coupon not found');
            error.statusCode = 404;
            throw error;
        }
        const { code, discount, startDate, expiryDate } = req.body;
        coupon.code = code;
        coupon.discount = discount;
        coupon.startDate = startDate;
        coupon.expiryDate = expiryDate;
        await coupon.save();
        res.status(200).json({
            success: true,
            message: "Coupon updated successfully",
            data: coupon
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}
export const deleteCoupon = async (req, res) => {
    try {
        let coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            const error = new Error('Coupon not found');
            error.statusCode = 404;
            throw error;
        }
        await coupon.deleteOne();
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}


export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const {userId} = await getIds(req);
    // 1️⃣ Find coupon
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon" });
    }

    // 2️⃣ Expiry Check
    if (new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    // 3️⃣ Get user cart total
    const cartItems = await Cart.find({ userId });
    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate cart total
    let cartTotal = 0;

    for (const item of cartItems) {
        cartTotal = item.subTotal 
    }
    // 4️⃣ Apply Minimum Order Validation
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return res.status(400).json({
        message: `Minimum order of ₹${coupon.minOrder} required`
      });
    }

    // 5️⃣ Apply Discount
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discount) / 100;
    } else if (coupon.discountType === "flat" || coupon.discountType === 'rupees') {
      discountAmount = coupon.discount;
    }
    // Prevent negative total
    let finalTotal = Math.max(cartTotal - discountAmount, 0);
    finalTotal = Math.round(finalTotal);
    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      cartTotal,
      discount: discountAmount,
      finalTotal
    });

  } catch (error) {
    next(error);
  }
};

