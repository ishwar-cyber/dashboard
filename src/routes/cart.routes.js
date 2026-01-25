import { Router } from 'express';

import {
 getCart, addToCart, clearCart, removeItem, increaseDecreaseQuantity
} from '../controllers/cart.controllers.js';

import { generateVisitorId } from '../middleware/visitor.middleware.js';
import { validateRequest } from '../middleware/cartValidator.js';
import {
  addToCartSchema,
  updateCartQuantitySchema,
  removeCartItemSchema,
} from '../zod-validater/cart.validation.js';

const cartRouter = Router();

/**
 * Visitor ID middleware
 * Applies to all cart routes
 */
cartRouter.use(generateVisitorId);

/**
 * Get cart
 */
cartRouter.get('/my', getCart);

/**
 * Add item to cart
 */
cartRouter.post(
  '/add',
  validateRequest(addToCartSchema),
  addToCart
);

/**
 * Update cart item quantity
 */
cartRouter.put(
  '/items/:id/update',
  validateRequest(updateCartQuantitySchema),
  increaseDecreaseQuantity
);

/**
 * Remove cart item
 */
cartRouter.delete(
  '/items/:id',
  validateRequest(removeCartItemSchema),
  removeItem
);

/**
 * Clear cart
 */
cartRouter.delete('/clear', clearCart);

export default cartRouter;
