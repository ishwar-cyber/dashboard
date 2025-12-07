import { Router } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderTracking,
    cancelOrder,
    getUserOrders,
    orderStatus,
    getOrderTracking,
    getOrderByIdAdmin,
    getOrderByOrderNumber
} from '../controllers/order.controllers.js';
import { tokenVerify, role } from '../middleware/auth.middlerwares.js';

const orderRouter = Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
orderRouter.post('/create-order', tokenVerify, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private/Admin
 */
orderRouter.get('/', tokenVerify, role('admin'), getAllOrders);

/**
 * @route   GET /api/orders/user/me
 * @desc    Get current user's orders
 * @access  Private
 */
orderRouter.get('/user/:id', tokenVerify, getUserOrders);
orderRouter.get('/admin/:orderId', tokenVerify, role('admin'), getOrderByIdAdmin);
/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
orderRouter.get('/:orderId', tokenVerify, getOrderById);

orderRouter.get('/status/:id', tokenVerify, getOrderByOrderNumber);
/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status (Admin only)
 * @access  Private/Admin
 */
orderRouter.put('/:orderId', tokenVerify, role('admin'), updateOrderTracking);

/**
 * @route   PUT /api/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private
 */
orderRouter.put('/:orderId/cancelled', tokenVerify, cancelOrder);
// orderRouter.get('/:userId/:orderId', tokenVerify, orderStatus);
orderRouter.get('/:orderId/tracking', tokenVerify, getOrderTracking);
export default orderRouter;