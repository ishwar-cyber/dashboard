import { Router } from 'express';
import {
    addToCart,
    getCartItems,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    getCartCount,
    mergeGuestCart,
    increaseCartItemQuantity,
    decreaseCartItemQuantity
} from '../controllers/cart.controllers.js';
import { authenticate } from '../middleware/auth.middlerwares.js';

const cartRouter = Router();

/**
 * @route   POST /api/cart/:visitorId/add
 * @desc    Add item to cart
 * @access  Public/Private
 */
cartRouter.post('/:visitorId', addToCart);

/**
 * @route   GET /api/cart/:visitorId
 * @desc    Get cart items
 * @access  Public/Private
 */
cartRouter.get('/:visitorId', getCartItems);

/**
 * @route   PUT /api/cart/:visitorId/:productId
 * @desc    Update cart item quantity
 * @access  Public/Private
 */
cartRouter.put('/:visitorId/:productId', updateCartItemQuantity);

/**
 * @route   PUT /api/cart/:visitorId/:productId/increase
 * @desc    Increase cart item quantity by 1
 * @access  Public/Private
 */
cartRouter.put('/:visitorId/:productId/increase', increaseCartItemQuantity);

/**
 * @route   PUT /api/cart/:visitorId/:productId/decrease
 * @desc    Decrease cart item quantity by 1
 * @access  Public/Private
 */
cartRouter.put('/:visitorId/:productId/decrease', decreaseCartItemQuantity);

/**
 * @route   DELETE /api/cart/:visitorId/:productId
 * @desc    Remove item from cart
 * @access  Public/Private
 */
cartRouter.delete('/:visitorId/:productId', removeCartItem);

/**
 * @route   DELETE /api/cart/:visitorId
 * @desc    Clear entire cart
 * @access  Public/Private
 */
cartRouter.delete('/:visitorId', clearCart);

/**
 * @route   GET /api/cart/:visitorId/count
 * @desc    Get cart item count
 * @access  Public/Private
 */
cartRouter.get('/:visitorId/count', getCartCount);

/**
 * @route   POST /api/cart/merge
 * @desc    Merge guest cart with user cart
 * @access  Private
 */
cartRouter.post('/merge', authenticate, mergeGuestCart);

export default cartRouter; 