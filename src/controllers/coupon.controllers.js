import prisma from '../config/prisma.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discount,
            discountType,
            applyTo,
            startDate,
            expiryDate,
            noExpiry,
            products
        } = req.body;

        const prismaData = {
            code,
            discount,
            discountType,
            applyTo,
            startDate,
            expiryDate,
            noExpiry,

            ...(products?.length
                ? {
                    products: {
                    create: products.map(p => ({
                        productId: p.productId
                    }))
                    }
                }
                : {}) // ✅ empty array → ignored
        };

        const coupon = await prisma.coupon.create({ data: prismaData });
        res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getCoupons = async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany();
        res.status(200).json({ success: true, message: 'Coupons fetched successfully', data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
export const getCouponById = async (req, res) => {
    try {
        const coupon = await prisma.coupon.findFirst({ where: { code: req.params.code, isActive: true } });
        if (!coupon) return res.status(404).json({ error: 'Coupon not found or expired' });
        res.status(200).json({ success: true, message: 'Coupon fetched successfully', data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getCouponByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await prisma.coupon.findFirst({ where: { code } });

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
        const id = Number(req.params.id);
        const existing = await prisma.coupon.findUnique({ where: { id } });
        if (!existing) {
            const error = new Error('Coupon not found');
            error.statusCode = 404;
            throw error;
        }
        const { code, discount, startDate, expiryDate } = req.body;
        const updated = await prisma.coupon.update({ where: { id }, data: { code, discount: discount ? Number(discount) : existing.discount, startDate: startDate ? new Date(startDate) : existing.startDate, expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate } });
        res.status(200).json({ success: true, message: 'Coupon updated successfully', data: updated });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}
export const deleteCoupon = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.coupon.findUnique({ where: { id } });
        if (!existing) {
            const error = new Error('Coupon not found');
            error.statusCode = 404;
            throw error;
        }
        await prisma.coupon.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
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
        const coupon = await prisma.coupon.findFirst({ where: { code } });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon" });
    }

    // 2️⃣ Expiry Check
        const expiry = coupon.expiryDate || coupon.expiry;
        if (expiry && new Date(expiry) < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    // 3️⃣ Get user cart total
        const cart = await prisma.cart.findFirst({ where: { userId: Number(userId) }, include: { items: true } });
        if (!cart || !cart.items || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

        // Calculate cart total
        let cartTotal = 0;
        for (const item of cart.items) {
                if (typeof item.subTotal === 'number') cartTotal += item.subTotal;
                else cartTotal += (Number(item.price || 0) * Number(item.quantity || 0));
        }
    // 4️⃣ Apply Minimum Order Validation
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return res.status(400).json({
        message: `Minimum order of ₹${coupon.minOrder} required`
      });
    }

    // 5️⃣ Apply Discount
    let discountAmount = 0;

        if (coupon.discountType === 'percentage') discountAmount = (cartTotal * Number(coupon.discount || 0)) / 100;
        else if (coupon.discountType === 'flat' || coupon.discountType === 'rupees') discountAmount = Number(coupon.discount || 0);
    // Prevent negative total
    let finalTotal = Math.max(cartTotal - discountAmount, 0);
    finalTotal = Math.round(finalTotal);
    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
                code: coupon.code,
                type: coupon.discountType,
                value: coupon.discount,
      },
      cartTotal,
      discount: discountAmount,
      finalTotal
    });

  } catch (error) {
    next(error);
  }
};

