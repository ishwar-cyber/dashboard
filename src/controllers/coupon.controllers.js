import Coupon from '../models/coupon.model.js';  // Fix the path to match your project structure

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


export const applyCoupon = async(req, res) =>{
     try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon" });
    }

    // Expiry check
    if (new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    // // Min order check
    // if (cartTotal < coupon.minOrder) {
    //   return res
    //     .status(400)
    //     .json({ message: `Minimum order ₹${coupon.minOrder} required` });
    // }

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    next(error);
  }
}

