import { getIds } from '../utilities/checkUserAndVisitor.js';
import {
  getCartByUserIdAndVisitorId,
  addToCartService,
  removeCartItemService,
  updateCartItemQuantityService,
  clearCartService
} from '../services/cart.service.js';

/* ---------------- GET CART ---------------- */
export const getCart = async (req, res) => {
  try {
    const { userId, visitorId } = await getIds(req);
    const data = await getCartByUserIdAndVisitorId({ userId, visitorId });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addToCart = async (req, res) => {
  const { userId, visitorId } = await getIds(req);
  const data = await addToCartService({
    userId,
    visitorId,
    ...req.body
  });

  res.json({ success: true, data });
};


/* ---------------- REMOVE ITEM ---------------- */
export const removeItem = async (req, res) => {
  try {
    await removeCartItemService({ cartItemId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Remove cart item error:', err);
    res.status(500).json({ success: false });
  }
};

/* ---------------- CLEAR CART ---------------- */
export const clearCart = async (req, res) => {
  try {
    const { userId, visitorId } = await getIds(req);
    await clearCartService({ userId, visitorId });

    res.json({ success: true });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ success: false });
  }
};
export const increaseDecreaseQuantity = async (req, res) => {
  try {
     console.log('ACTION', req.body);
    const id = Number(req.params.id);
    const { action } = req.body;
    const { userId, visitorId } = await getIds(req);
   
    
    const data = await updateCartItemQuantityService({
      id,
      action,
      userId,
      visitorId
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Update quantity error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};