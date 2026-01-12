import {
  addItemToCart,
  updateCartItemQuantity,
  removeItemCart,
  clearCartFromCart,
  applyCoupon,
  getOrCreateCart,
  getCartByVisitorId,
} from '../services/cart.service.js';

import { getIds } from '../utilities/checkUserAndVisitor.js';

/**
 * GET CART
 */
export const getCart = async (req, res) => {
  try {
    const { userId, visitorId } = await getIds(req);
    console.log('user id',userId);
    
    if (!userId && !visitorId) {
      return res.status(200).json({
        success: true,
        data: { items: [], subTotal: 0 },
      });
    }

    const cart = userId
      ? await getOrCreateCart({ userId })
      : await getCartByVisitorId({ visitorId });

    res.json({ success: true, data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * ADD ITEM
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const { userId, visitorId } = await getIds(req);

    const cart = await addItemToCart(
      { userId, visitorId },
      { productId, variantId, quantity }
    );

    res.json({ success: true, message: 'Item added', data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE QUANTITY
 */
export const updateCartQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const { userId, visitorId } = await getIds(req);

    const cart = await updateCartItemQuantity(
      { userId, visitorId },
      id,
      quantity
    );

    res.json({ success: true, message: 'Quantity updated', data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * REMOVE ITEM
 */
export const removeItemFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, visitorId } = await getIds(req);

    const cart = await removeItemCart({ userId, visitorId }, id);

    res.json({ success: true, message: 'Item removed', data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * CLEAR CART
 */
export const clearCart = async (req, res) => {
  try {
    const { userId, visitorId } = await getIds(req);

    const cart = await clearCartFromCart({ userId, visitorId });

    res.json({ success: true, message: 'Cart cleared', data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * APPLY COUPON
 */
export const applyCoupons = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId, visitorId } = await getIds(req);

    const cart = await applyCoupon({ userId, visitorId }, code);

    res.json({ success: true, message: 'Coupon applied', data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
