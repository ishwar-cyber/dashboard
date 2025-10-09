import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import { validateObjectId } from '../utilities/validation.js';
import { sendOrderEmail } from '../utilities/email.js';
import Coupon from '../models/coupon.model.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
import { generateOrderNumber } from '../utilities/orderNumber.js';
import axios from "axios";
export const createOrder = async (req, res) => {
  try {
    const { userId, visitorId } = await getIds(req);
    const orderNumber = await generateOrderNumber();
    const { items, shippingAddress, paymentMethod, totalAmount, couponCode } = req.body;
    
    if (!userId && !visitorId) {
      return res.status(400).json({ success: false, message: "User or Visitor ID is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order items are required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    
    // 🔎 Stock check
    for (let item of items) {
      const product = await Product.findById(item.product.id || item.product);
      if (!product) return res.status(404).json({ message: `Product ${item.name} not found` });

      // For variant check
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) return res.status(404).json({ message: `Variant not found for ${item.name}` });
        if (Number(variant.stock) < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
        }
      } else {
        console.log(product);
        
        if (product.stock === 'out') {
          return res.status(400).json({ message: `Product ${item.name} is out of stock` });
        }
        if (Number(product.stock) < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
        }
      }
    }
    // 🎟 Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon) {
        discount = coupon.type === "percentage" ? (totalAmount * coupon.value) / 100 : coupon.value;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const finalAmount = totalAmount - discount;

    const order = new Order({
      orderNumber,
      user: userId || null,
      visitorId: visitorId || null,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount: finalAmount,
      discountApplied: discount,
    });

    await order.save();
    // ✅ Clear cart after order
    await Cart.findOneAndDelete({ userId });
       // Call Cashfree API
    const user = await User.findById(userId);
    const response = await axios.post(
      `https://sandbox.cashfree.com/pg/orders`,
      {
        orderNumber: orderNumber,
        order_amount: 1,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_name: "ishwar pandit",
          customer_email: "customerEmail@gmail.com",
          customer_phone: "9856325415",
        },
        order_meta: {
          return_url: `https://application-shoppyness.vercel.app/payment-status?order_id={order_id}`,
        },
      },
      {
        headers: {
          "x-client-id": "TEST43174731bcc18792591b7b55e3747134",
          "x-client-secret": "TEST9515edf6d8b1c6c1768721988ec4dcae903f6ed",
          "x-api-version": "2025-01-01",
          "Content-Type": "application/json",
        },
      }
    );

    const paymentLink = response.data.payments?.url;
    const paymentSessionId = response.data.payment_session_id;

    // Update DB with payment link
    order.paymentLink = paymentLink;
    await order.save();
      // 🔻 Deduct stock
    for (let item of items) {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.product, "variants._id": item.variantId },
          { $inc: { "variants.$.stock": -item.quantity } }
        );
      } else if (item.product.stock === 'in') {
        // await Product.findByIdAndUpdate(item.product, { $set: { stock: 'out' } });
      } else {
        let findProduct = await Product.findByIdAndUpdate(item.product.id,{ $inc: { stock: -item.quantity }});
      }
    }

    res.json({ success: true, paymentLink, paymentSessionId, orderNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Order creation failed", error: err.message });
  }
};

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

        // if (req.query.userId) {
        //     filterQuery.user = req.query.userId;
        // }
        
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
            .populate({
                path: 'user',
                select: 'username email phone'
            })
            .populate({
                path: 'items.product',
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // 👈 take from query param

    if (!validateObjectId(id)) {
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
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ✅ Update status directly
    order.orderStatus = status;
    order.statusUpdatedAt = new Date();
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
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filterQuery = { user: userId };
        
        if (req.query.status) {
            filterQuery.orderStatus = req.query.status;
        }

        const orders = await Order.find(filterQuery)
            .populate({
                path: 'items.product',
                select: 'name price thumbnail sku'
            })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalOrders / limit);

        // Get user statistics
        // const stats = await Order.getStatistics(userId);

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
                // statistics: stats[0] || {
                //     totalOrders: 0,
                //     totalSpent: 0,
                //     averageOrderValue: 0,
                //     pendingOrders: 0,
                //     deliveredOrders: 0
                // }
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

export const orderStatus = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.order_id });   
        // const statuses = Order.schema.path('orderStatus').enumValues;
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get order statuses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order statuses',
            error: error.message
        });
    }
};

