import prisma from '../config/prisma.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
import { getCartByUserIdAndVisitorId } from '../services/cart.service.js';
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
            products,
            categories
        } = req.body;

        // Normalize and accept different shapes for products/categories:
        // - array of numbers: [1,2]
        // - array of objects: [{ productId: 1 }] or [{ id: 1 }]
        const normalizeId = (val, keyName) => {
            if (val == null) return null;
            if (typeof val === 'object') return Number(val[keyName] ?? val.id ?? null);
            return Number(val);
        };

        const productCreates = Array.isArray(products)
            ? products
                  .map((p) => ({ productId: normalizeId(p, 'productId') }))
                  .filter((x) => Number.isFinite(x.productId))
            : [];

        const categoryCreates = Array.isArray(categories)
            ? categories
                  .map((c) => ({ categoryId: normalizeId(c, 'categoryId') }))
                  .filter((x) => Number.isFinite(x.categoryId))
            : [];

        const prismaData = {
            code,
            discount: discount != null ? Number(discount) : undefined,
            discountType,
            applyTo,
            startDate: startDate ? new Date(startDate) : undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            noExpiry: !!noExpiry,

            ...(productCreates.length
                ? { products: { create: productCreates } }
                : {}),

            ...(categoryCreates.length
                ? { categories: { create: categoryCreates } }
                : {}),
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
    const { userId, visitorId } = await getIds(req);
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

    // 3️⃣ Get cart (supports logged-in user or visitor)
    const cart = await getCartByUserIdAndVisitorId({ userId: userId ? Number(userId) : null, visitorId });
    if (!cart || !cart.items || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // Use subtotal from cart service (price * qty, excludes shipping)
    const cartTotal = Number(cart.subTotal || 0);
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

