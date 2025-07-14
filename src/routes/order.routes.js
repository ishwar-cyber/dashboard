import { Router } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getUserOrders
} from '../controllers/order.controllers.js';
import { authenticate, roleBase } from '../middleware/auth.middlerwares.js';

const orderRouter = Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
orderRouter.post('/', authenticate, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private/Admin
 */
orderRouter.get('/',authenticate, roleBase(['admin']), getAllOrders);

/**
 * @route   GET /api/orders/user/me
 * @desc    Get current user's orders
 * @access  Private
 */
orderRouter.get('/user/me', authenticate, getUserOrders);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
orderRouter.get('/:orderId', authenticate, getOrderById);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status (Admin only)
 * @access  Private/Admin
 */
orderRouter.put('/:orderId/status', authenticate, roleBase(['admin']), updateOrderStatus);

/**
 * @route   PUT /api/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private
 */
orderRouter.put('/:orderId/cancel', authenticate, cancelOrder);

export default orderRouter; 