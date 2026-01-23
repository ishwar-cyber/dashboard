import prisma from '../config/prisma.js';
import { sendOrderEmail } from '../utilities/email.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
import { generateOrderNumber } from '../utilities/orderNumber.js';
import axios from "axios";
const resolveItemPrice = (product, variantId) => {
  if (variantId) {
    const variant = product.variants.find(v => v.id === Number(variantId));
    if (!variant) throw new Error("Variant not found");
    return {
      price: Number(variant.price),
      image: variant.images?.[0]?.url || product.images?.[0]?.url || null,
      variantName: variant.name
    };
  }

  return {
    price: Number(product.price),
    image: product.images?.[0]?.url || null,
    variantName: null
  };
};

export const createOrder1 = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, items } = req.body;
    const userId = Number(req.user.id);

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let orderItems = [];
    let calculatedTotal = 0;

// 🔒 TRANSACTION START
const order = await prisma.$transaction(async (tx) => {

  const orderNumber = generateOrderNumber();

  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: Number(item.productId) },
      include: { variants: true, images: true }
    });

    if (!product) throw new Error("Product not found");

    // ✅ Resolve price (variant > product)
    const resolved = resolveItemPrice(product, item.variantId);

    // ✅ STOCK CHECK + DECREMENT
    if (item.variantId) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: Number(item.variantId),
        stock: 1 // only update if in stock
      },
      data: {
        stock: 0 // mark out of stock after order
      }
    });

    if (updated.count === 0) {
      throw new Error("Variant is out of stock");
    }

    } else {
     const updated = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: 1
        },
        data: {
          stock: 0
        }
      });

      if (updated.count === 0) {
        throw new Error("Product is out of stock");
      }
    }

    const itemTotal =
      (resolved.price * Number(item.quantity)) +
      (Number(item.shippingCharges) || 0);

    calculatedTotal += itemTotal;
    console.log('calculate Total', calculatedTotal);
    
    orderItems.push({
      productId: product.id,
      variantId: item.variantId || null,
      name: product.name,
      variantName: resolved.variantName,
      price: resolved.price,
      quantity: Number(item.quantity),
      image: resolved.image,
      shippingCharges: Number(item.shippingCharges) || 0,
      total: itemTotal
    });
  }

  const cashfreeRes = await axios.post(
    `https://sandbox.cashfree.com/pg/orders`,
    {
      order_id: orderNumber,
      order_amount: calculatedTotal,
      order_currency: "INR",
      customer_details: {
        customer_id: String(userId),
        customer_name: shippingAddress.fullName,
        customer_phone: shippingAddress.phone,
        customer_email: "customer@email.com"
      },
      order_meta: {
        return_url: "http://localhost:4400/payment-status?order_id={order_id}",
        notify_url: "http://localhost:4400/api/payment/webhook"
      }
    },
    {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": process.env.CASHFREE_API_VERSION,
        "Content-Type": "application/json"
      }
    }
  );
  console.log('cashfreeRes', cashfreeRes);
  
  const cashfreeOrderId = cashfreeRes.data.cf_order_id;
  const paymentSessionId = cashfreeRes.data.payment_session_id;

  if (!cashfreeOrderId) {
    throw new Error("Failed to create Cashfree order");
  }
  
  // ✅ CREATE ORDER
  const order = await prisma.order.create({
  data: {
    orderNumber,
    userId,
    paymentMethod: "online",
    totalAmount: calculatedTotal,

    orderStatus: "placed",
    paymentStatus: "pending",

    cashfreeOrderId,        // ✅ REQUIRED FIELD
    paymentSessionId,       // ✅ OPTIONAL / REQUIRED (your choice)

    items: {
      create: orderItems
    },

    address: {
      create: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode
      }
    }
  },
  include: { items: true }
});

});


return res.status(201).json({
  success: true,
  message: "Order created successfully",
  data: {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentSessionId,
    paymentLink: cashfreeRes.data.payments?.url
  }
});


  } catch (err) {
    console.error("Create order error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const createOrder2 = async (req, res) => {
  try {
    const {
      shippingAddressId,
      paymentMethod,
      items
    } = req.body;

    const userId = Number(req.user.id);

    if (!shippingAddressId) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 🔹 Fetch address
    const shippingAddress = await prisma.address.findUnique({
      where: { id: Number(shippingAddressId) }
    });

    if (!shippingAddress) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    let orderItems = [];
    let calculatedTotal = 0;
    const orderNumber = generateOrderNumber();

    // 🔒 TRANSACTION (STOCK + SNAPSHOT)
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: Number(item.productId) },
          include: { variants: true, images: true }
        });

        if (!product) throw new Error("Product not found");

        const resolved = resolveItemPrice(product, item.variantId);

        // 🔹 Binary stock logic
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: Number(item.variantId), stock: 1 },
            data: { stock: 0 }
          });
          if (updated.count === 0) throw new Error("Variant out of stock");
        } else {
          const updated = await tx.product.updateMany({
            where: { id: product.id, stock: 1 },
            data: { stock: 0 }
          });
          if (updated.count === 0) throw new Error("Product out of stock");
        }

        const quantity = Number(item.quantity || 1);
        const itemTotal = resolved.price * quantity;
        calculatedTotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: item.variantId || null,
          name: product.name,
          variantName: resolved.variantName || null,
          price: resolved.price,
          quantity,
          image: resolved.image
        });
      }
    });

    // 🔹 CREATE CASHFREE ORDER (OPTION-1)
    const cashfreeRes = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderNumber,
        order_amount: calculatedTotal,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),
          customer_name: shippingAddress.fullName,
          customer_phone: shippingAddress.phone
        },
        order_meta: {
          return_url: "http://localhost:4400/payment-status?order_id={order_id}",
          notify_url: "http://localhost:4400/api/payment/webhook"
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": process.env.CASHFREE_API_VERSION,
          "Content-Type": "application/json"
        }
      }
    );

    if (!cashfreeRes.data?.cf_order_id) {
      throw new Error("Cashfree order creation failed");
    }

    // 🔹 SAVE ORDER
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        paymentMethod,
        totalAmount: calculatedTotal,

        orderStatus: "placed",
        paymentStatus: "pending",

        cashfreeOrderId: cashfreeRes.data.cf_order_id,
        paymentSessionId: cashfreeRes.data.payment_session_id,

        items: { create: orderItems },

        address: {
          create: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      paymentSessionId: order.paymentSessionId,
      paymentLink: cashfreeRes.data.payments?.url
    });

  } catch (err) {
    console.error("Create order error:", err);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { shippingAddressId, paymentMethod, items } = req.body;
    const userId = Number(req.user.id);

    if (!shippingAddressId) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 🔹 Fetch address
    const shippingAddress = await prisma.address.findUnique({
      where: { id: Number(shippingAddressId) }
    });

    if (!shippingAddress) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    let orderItems = [];
    let calculatedTotal = 0;
    const orderNumber = generateOrderNumber();

    // 🔒 TRANSACTION (ONLY SNAPSHOT + PRICE CALCULATION)
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: Number(item.productId) },
          include: { variants: true, images: true }
        });

        if (!product) throw new Error("Product not found");

        const resolved = resolveItemPrice(product, item.variantId);

        const quantity = Number(item.quantity || 1);
        const itemTotal = resolved.price * quantity;

        calculatedTotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: item.variantId || null,
          name: product.name,
          variantName: resolved.variantName || null,
          price: resolved.price,
          quantity,
          image: resolved.image
        });
      }
    });

    // 🔹 CREATE CASHFREE ORDER (OPTION-1)
    const cashfreeRes = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderNumber,
        order_amount: calculatedTotal,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),
          customer_name: shippingAddress.fullName,
          customer_phone: shippingAddress.phone
        },
        order_meta: {
          return_url: "https://application-shoppyness.vercel.app/payment-status?order_id={order_id}",
          notify_url: "https://application-shoppyness.vercel.app/payment/webhook"
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": process.env.CASHFREE_API_VERSION,
          "Content-Type": "application/json"
        }
      }
    );

    if (!cashfreeRes.data?.cf_order_id) {
      throw new Error("Cashfree order creation failed");
    }


    // 🔹 SAVE ORDER (NO STOCK TOUCH)
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        paymentMethod,
        totalAmount: calculatedTotal,

        orderStatus: "placed",
        paymentStatus: "pending",

        cashfreeOrderId: cashfreeRes.data.cf_order_id,
        paymentSessionId: cashfreeRes.data.payment_session_id,

        items: { create: orderItems },

        address: {
          create: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode
          }
        }
      }
    });
    if(order.orderStatus === 'placed'){
      await cartItemsAfterOrder(userId, items);
    }
    return res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      paymentSessionId: order.paymentSessionId,
      paymentLink: cashfreeRes.data.payments?.url
    });

  } catch (err) {
    console.error("Create order error:", err);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};


/**
 * Remove purchased cart items after successful payment
 * and optionally close the active cart.
 */
export const cartItemsAfterOrder = async (userId, items) => {
  if (!userId) {
    throw new Error('UserId is required');
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: true, message: 'No cart items to clear' };
  }

  return prisma.$transaction(async (tx) => {
    /* ---------------- GET ACTIVE USER CART ---------------- */
    const cart = await tx.cart.findFirst({
      where: {
        userId,
        isActive: true
      }
    });

    if (!cart) {
      return { success: true, message: 'No active cart found' };
    }

    /* ---------------- DELETE PURCHASED ITEMS ---------------- */
    for (const item of items) {

      // ===== PRODUCT WITH VARIANT =====
      if (item.variantId !== null && item.variantId !== undefined) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId
          }
        });

      // ===== PRODUCT WITHOUT VARIANT =====
      } else {
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            productId: item.productId,
            variantId: null
          }
        });
      }
    }

    /* ---------------- CLOSE CART (RECOMMENDED) ---------------- */
    await tx.cart.update({
      where: { id: cart.id },
      data: { isActive: false }
    });

    return {
      success: true,
      message: 'Cart items cleared successfully'
    };
  });
};

export const getAllOrders = async (req, res) => {
    try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Build Prisma where filter
    const where = {};
    if (req.query.orderStatus) where.orderStatus = req.query.orderStatus;
    if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;
    if (req.query.paymentMethod) where.paymentMethod = req.query.paymentMethod;
    if (req.query.startDate && req.query.endDate) where.createdAt = { gte: new Date(req.query.startDate), lte: new Date(req.query.endDate) };
    if (req.query.minPrice || req.query.maxPrice) {
      where.totalAmount = {};
      if (req.query.minPrice) where.totalAmount.gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) where.totalAmount.lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.orderNumber) where.orderNumber = { contains: req.query.orderNumber };

    const include = {
      user: { select: { username: true, email: true, phone: true } },
      items: true,
      address: true,
      tracking: true,
      refund: true
    };

    const [orders, totalOrders, stats, orderStatusStats, paymentStatusStats] = await Promise.all([
      prisma.order.findMany({ where, include, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { totalAmount: true }, _avg: { totalAmount: true }, _count: { _all: true } }),
      prisma.order.groupBy({ by: ['orderStatus'], where, _count: { _all: true } }),
      prisma.order.groupBy({ by: ['paymentStatus'], where, _count: { _all: true } })
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, totalPages, totalOrders, hasNext: page < totalPages, hasPrev: page > 1 },
        statistics: {
          totalRevenue: stats._sum?.totalAmount || 0,
          averageOrderValue: stats._avg?.totalAmount || 0,
          totalOrders: stats._count?._all || totalOrders,
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
    const requesterId = req.user?._id || req.user?.id || req.user?.userId;

    // Try numeric id first, else try orderNumber
    let order = null;
    if (!isNaN(Number(orderId))) {
      const idNum = Number(orderId);
      order = await prisma.order.findUnique({ where: { id: idNum }, include: { user: { select: { username: true, email: true, phone: true, id: true } }, items: true, address: true, tracking: true, refund: true } });
    } else {
      order = await prisma.order.findFirst({ where: { orderNumber: orderId }, include: { user: { select: { username: true, email: true, phone: true, id: true } }, items: true, address: true, tracking: true, refund: true } });
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check access: allow user owner or admin
    if (order.userId && String(order.userId) !== String(requesterId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
            error: error.message
        });
    }
};

export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Admin view: support numeric id or orderNumber
    let adminOrder = null;
    if (!isNaN(Number(orderId))) {
      adminOrder = await prisma.order.findUnique({ where: { id: Number(orderId) }, include: { user: { select: { username: true, email: true, phone: true, role: true, createdAt: true, id: true } }, items: true, address: true, tracking: true, refund: true } });
    } else {
      adminOrder = await prisma.order.findFirst({ where: { orderNumber: orderId }, include: { user: { select: { username: true, email: true, phone: true, role: true, createdAt: true, id: true } }, items: true, address: true, tracking: true, refund: true } });
    }

    if (!adminOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    // Summary
    const totalItems = adminOrder.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
    const totalPrice = adminOrder.items?.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0) || 0;

    const summary = {
      orderNumber: adminOrder.orderNumber,
      totalItems,
      totalPrice,
      paymentMethod: adminOrder.paymentMethod,
      paymentStatus: adminOrder.paymentStatus,
      orderStatus: adminOrder.orderStatus,
      createdAt: adminOrder.createdAt,
    };

    // Tracking summary
    let trackingSummary = null;
    if (Array.isArray(adminOrder.tracking)) trackingSummary = adminOrder.tracking.find(t => t.completed) || adminOrder.tracking[0];

    const result = Object.assign({}, adminOrder, { summary, trackingSummary, adminView: true });

    return res.json({ success: true, data: result });

  } catch (error) {
    console.error("Admin Get Order Error:", error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order', error: error.message });
  }
};

export const updateOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.query;

    // Support numeric id or orderNumber
    let orderRec = null;
    if (!isNaN(Number(orderId))) orderRec = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    else orderRec = await prisma.order.findFirst({ where: { orderNumber: orderId } });
    if (!orderRec) return res.status(404).json({ message: 'Order not found' });

    const orderIdNum = orderRec.id;
    const tracks = await prisma.orderTracking.findMany({ where: { orderId: orderIdNum }, orderBy: { id: 'asc' } });
    const statusIndex = tracks.findIndex(step => step.stepKey === status);
    if (statusIndex === -1) return res.status(400).json({ message: 'Invalid status' });

    // Update all steps up to statusIndex
    const updates = [];
    for (let i = 0; i <= statusIndex; i++) {
      if (!tracks[i].completed) {
        updates.push(prisma.orderTracking.update({ where: { id: tracks[i].id }, data: { completed: true, completedAt: new Date() } }));
      }
    }
    await Promise.all(updates);

    const updatedOrder = await prisma.order.update({ where: { id: orderIdNum }, data: { orderStatus: status } });
    const updatedTracks = await prisma.orderTracking.findMany({ where: { orderId: orderIdNum }, orderBy: { id: 'asc' } });

    return res.json({ success: true, message: `Order updated to ${status}`, orderStatus: updatedOrder.orderStatus, tracking: updatedTracks });

  } catch (error) {
    next(error);
  }
};



export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
    const ids = await getIds(req);
    const requesterId = req.user?._id || req.user?.id || req.user?.userId;

    const order = await prisma.order.findFirst({ where: { orderNumber: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check if user can cancel this order (owner or admin)
    if (order.userId && String(order.userId) !== String(requesterId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (order.orderStatus === 'cancelled') return res.status(400).json({ success: false, message: 'Order already cancelled' });

    // Check if order can be cancelled
    const cancellableStatuses = ['placed', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });

    // Update tracking: mark cancelled step completed in OrderTracking table
    const tracks = await prisma.orderTracking.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } });
    const cancelStep = tracks.find(t => t.stepKey === 'cancelled' || t.stepKey === 'cancel');
    if (!cancelStep) return res.status(400).json({ message: 'Invalid status' });

    await prisma.orderTracking.update({ where: { id: cancelStep.id }, data: { completed: true, completedAt: new Date() } });

    const updated = await prisma.order.update({ where: { id: order.id }, data: { orderStatus: 'cancelled', cancelReason: reason || null } });

    const updatedTracks = await prisma.orderTracking.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } });

    res.json({ success: true, message: 'Order cancelled successfully', data: { orderId: updated.id, orderNumber: updated.orderNumber, status: updated.orderStatus, tracking: updatedTracks } });

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
    const userId = req.params.id || req.user?.id || req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { userId: Number(userId) };
    if (req.query.status) where.orderStatus = req.query.status;

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, address: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({ success: true, data: { orders, pagination: { page, limit, totalPages, totalOrders, hasNext: page < totalPages, hasPrev: page > 1 } } });

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
    const orderId = req.params.id;
    const userId = req.params.userId || req.user?.id || req.user?._id;

    const where = { orderNumber: orderId };
    if (userId) where.userId = Number(userId);

    const order = await prisma.order.findFirst({ where });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

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

export const getOrderByOrderNumber = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.order.findFirst({ where: { orderNumber: orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    return res.json({
      success: true,
      orderId: order.orderNumber,
      status: order.paymentStatus,
      amount: order.totalAmount,
      currency: 'INR',
      transactionId: order.transactionId,
      paymentMessage: order.paymentMessage,
      paymentTime: order.paymentTime,
      paymentSessionId: order.paymentSessionId || order.paymentSessionId,
      items: order.items?.map((it) => ({
        productId: it.productId?.toString(),
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        image: it.image,
      })),
    });
  } catch (err) {
    console.error('Order status error', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
 
export const getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    let order = null;
    if (!isNaN(Number(orderId))) {
      order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    }
    if (!order) order = await prisma.order.findFirst({ where: { orderNumber: orderId } });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const tracks = await prisma.orderTracking.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } });

    res.status(200).json({ success: true, payload: { orderStatus: order.orderStatus, tracking: tracks, orderNumber: order.orderNumber } });

  } catch (error) {
    next(error);
  }
};

export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    const refundAmount = Number(amount);
    
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid refund amount" });
    }
    // Get order
    const order = await prisma.order.findFirst({ where: { orderNumber: orderId }, include: { items: true } });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only cancelled orders can be refunded
    if (order.orderStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled orders can be refunded"
      });
    }

    // Check refund amount does not exceed total
    if (refundAmount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Refund cannot exceed total order value ₹${order.totalAmount}`
      });
    }

    // Validate based on item price
    const itemTotal = (order.items || []).reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 0)), 0);
    if (refundAmount > itemTotal) return res.status(400).json({ success: false, message: `Refund cannot exceed item total price ₹${itemTotal}` });

    // Must have cashfreeOrderId stored earlier
    // if (!order.cashfreeOrderId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cashfree order not found for this order"
    //   });
    // }

    // Generate unique refund ID
    const refundId = `refund_${order.orderNumber}_${Date.now()}`;

    // Cashfree refund API URL
    const cashfreeURL = `${process.env.CASHFREE_BASE_URL}/orders/${order.orderNumber}/refunds`;

    const payload = {
      refund_amount: refundAmount,
      refund_id: refundId,
      refund_note: reason || 'refund processed by admin',
      refund_speed: 'STANDARD'
    };

    const headers = {
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      "x-api-version":  process.env.CASHFREE_API_VERSION,
      "Content-Type": "application/json"
    };

    const response = await axios.post(cashfreeURL, payload, { headers });
    if (!response.data || response.data.status !== 'SUCCESS') return res.status(400).json({ success: false, message: 'Cashfree refund failed', data: response.data });

    // Save refund info in OrderRefund table and update order status
    await prisma.orderRefund.create({ data: { orderId: order.id, amount: refundAmount, reason: reason || 'Refund processed', refundedAt: new Date(), cashfreeRefundId: refundId } });
    const updated = await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'refunded' } });

    return res.json({ success: true, message: `Refund ₹${refundAmount} processed successfully`, refund: { amount: refundAmount, reason }, cashfree: response.data });

  } catch (error) {
    console.error("Refund Error:", error);
    return res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message
    });
  }
};



export const cashfreeWebhook = async (req, res) => {
  try {
    if (!verifyCashfreeSignature(req)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString("utf8"));
    const data = payload.data;

    const orderNumber = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;

    if (!orderNumber) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🔁 Idempotency
    if (order.paymentStatus === "success") {
      return res.status(200).json({ message: "Already processed" });
    }

    // ✅ PAYMENT SUCCESS
    if (paymentStatus === "SUCCESS") {
      await prisma.$transaction(async (tx) => {

        // 🔹 Update order
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "success",
            orderStatus: "confirmed"
          }
        });

        // 🔹 UPDATE STOCK (0 / 1)
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: 1 },
              data: { stock: 0 }
            });
          } else {
            await tx.product.updateMany({
              where: { id: item.productId, stock: 1 },
              data: { stock: 0 }
            });
          }
        }

        // 🔹 CLEAR CART
        await tx.cartItem.deleteMany({
          where: { cart: { userId: order.userId } }
        });

        await tx.cart.deleteMany({
          where: { userId: order.userId }
        });
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ message: "Webhook failed" });
  }
};
