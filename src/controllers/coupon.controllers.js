import Coupon from '../modules/coupon.modules.js';  // Fix the path to match your project structure

export const createCoupon = async (req, res) => {
    try {
        const { code, discount, startDate, expiryDate } = req.body;
        const coupon = new Coupon({
            code,
            discount,
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
        let coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            const error = new Error('Coupon not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}
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




