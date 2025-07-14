import Order from '../modules/order.modules.js';
import Cart from '../modules/cart.modules.js';
import Product from '../modules/product.modules.js';
import { validateObjectId } from '../utilities/validation.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
    try {
        const {
            cartId,
            shippingAddress,
            billingAddress,
            paymentMethod,
            paymentId,
            paymentGateway,
            notes,
            source = 'web',
            ipAddress,
            userAgent
        } = req.body;

        const userId = req.user._id;

        // Validate required fields
        if (!cartId || !validateObjectId(cartId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid cart ID is required'
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required'
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        // Validate shipping address
        const requiredAddressFields = ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'pincode', 'phone', 'email'];
        for (const field of requiredAddressFields) {
            if (!shippingAddress[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required in shipping address`
                });
            }
        }

        // Get cart and validate
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate stock and prepare order items
        const orderItems = [];
        let subtotal = 0;

        for (const cartItem of cart.items) {
            const product = await Product.findById(cartItem.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${cartItem.product} not found`
                });
            }

            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
                });
            }

            // Create order item
            orderItems.push({
                product: cartItem.product,
                quantity: cartItem.quantity,
                price: cartItem.price,
                totalPrice: cartItem.totalPrice,
                selectedOptions: cartItem.selectedOptions,
                sku: product.sku || product._id.toString(),
                productName: product.name
            });

            subtotal += cartItem.totalPrice;

            // Update product stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // Calculate totals
        const tax = 0; // Calculate based on your tax logic
        const shipping = 0; // Calculate based on your shipping logic
        const discount = 0; // Apply any discounts
        const totalPrice = subtotal + tax + shipping - discount;

        // Create order
        const order = new Order({
            user: userId,
            orderItems,
            subtotal,
            tax,
            shipping,
            discount,
            totalPrice,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod,
            paymentId,
            paymentGateway,
            notes,
            source,
            ipAddress,
            userAgent
        });

        const savedOrder = await order.save();

        // Clear the cart
        cart.clearCart();
        await cart.save();

        // Populate order details
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('user', 'name email')
            .populate({
                path: 'orderItems.product',
                select: 'name price thumbnail sku'
            });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: populatedOrder._id,
                orderNumber: populatedOrder.orderNumber,
                totalAmount: populatedOrder.totalPrice,
                orderStatus: populatedOrder.orderStatus,
                paymentStatus: populatedOrder.paymentStatus,
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                orderDetails: populatedOrder
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

/**
 * @desc    Get all orders with pagination and filters
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Sorting
        const sortBy = req.query.sortBy || 'orderDate';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Filtering
        const filterQuery = {};
        
        if (req.query.orderStatus) {
            filterQuery.orderStatus = req.query.orderStatus;
        }
        
        if (req.query.paymentStatus) {
            filterQuery.paymentStatus = req.query.paymentStatus;
        }
        
        if (req.query.paymentMethod) {
            filterQuery.paymentMethod = req.query.paymentMethod;
        }
        
        if (req.query.startDate && req.query.endDate) {
            filterQuery.orderDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }
        
        if (req.query.userId) {
            filterQuery.user = req.query.userId;
        }
        
        if (req.query.minPrice || req.query.maxPrice) {
            filterQuery.totalPrice = {};
            if (req.query.minPrice) {
                filterQuery.totalPrice.$gte = parseFloat(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filterQuery.totalPrice.$lte = parseFloat(req.query.maxPrice);
            }
        }

        if (req.query.orderNumber) {
            filterQuery.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
        }

        // Build query with population
        const orders = await Order.find(filterQuery)
            .populate('user', 'name email phone')
            .populate({
                path: 'orderItems.product',
                select: 'name price thumbnail sku'
            })
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        // Get total count
        const totalOrders = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalOrders / limit);

        // Calculate statistics
        const stats = await Order.aggregate([
            { $match: filterQuery },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    averageOrderValue: { $avg: '$totalPrice' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const orderStatusStats = await Order.aggregate([
            { $match: filterQuery },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        const paymentStatusStats = await Order.aggregate([
            { $match: filterQuery },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalOrders,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                statistics: {
                    totalRevenue: stats[0]?.totalRevenue || 0,
                    averageOrderValue: stats[0]?.averageOrderValue || 0,
                    totalOrders: stats[0]?.totalOrders || 0,
                    orderStatusStats,
                    paymentStatusStats
                }
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
            error: error.message
        });
    }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:orderId
 * @access  Private
 */
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        if (!validateObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID is required'
            });
        }

        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate({
                path: 'orderItems.product',
                select: 'name price thumbnail sku description'
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user can access this order
        if (order.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
            error: error.message
        });
    }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:orderId/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        if (!validateObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID is required'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update status
        order.updateStatus(status, notes);
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.orderStatus,
                statusUpdatedAt: order.statusUpdatedAt
            }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:orderId/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        if (!validateObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user can cancel this order
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if order can be cancelled
        const cancellableStatuses = ['pending', 'confirmed'];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Restore product stock
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // Update order status
        order.updateStatus('cancelled', reason || 'Cancelled by customer');
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.orderStatus
            }
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error.message
        });
    }
};

/**
 * @desc    Get user orders
 * @route   GET /api/orders/user/me
 * @access  Private
 */
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filterQuery = { user: userId };
        
        if (req.query.status) {
            filterQuery.orderStatus = req.query.status;
        }

        const orders = await Order.find(filterQuery)
            .populate({
                path: 'orderItems.product',
                select: 'name price thumbnail sku'
            })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalOrders / limit);

        // Get user statistics
        const stats = await Order.getStatistics(userId);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalOrders,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                statistics: stats[0] || {
                    totalOrders: 0,
                    totalSpent: 0,
                    averageOrderValue: 0,
                    pendingOrders: 0,
                    deliveredOrders: 0
                }
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user orders',
            error: error.message
        });
    }
};