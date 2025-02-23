import Order from '../modules/order.modules.js';
import OrderItem from '../modules/order_items.modules.js';
import Product from '../modules/product.modules.js';
export const order = async (req, res) => {
    try {
        const orderItemsId = req.body.orderItems.map(async (item) => {
           let product = new OrderItem({
                quantity: item.quantity,
                product: item.product
            });
            product = await product.save();
            return product._id;

        });
        // const products = await Product.find({ _id: { $in: orderItemsId } });
        const products = await orderItemsId;
        const { phone, orderStatus, paymentStatus, paymentType, addressLine1, addressLine2,city, state,pincode, totalPrice } = req.body;
        const order = new Order({
            user: req.user._id,
            orderItems: products,
            orderStatus,
            paymentStatus,
            paymentType,
            addressLine1,
            addressLine2,
            city,
            state,
            phone,
            pincode,
            totalPrice
        });
        const newOrder = await order.save();
        res.status(201).json({
            success: true,
            message: "Order is successfully placed",
            data: newOrder
        })
        orderItems.map(async (item) => {
            let product = await Product.findById(item.product); 
            product.stock = product.stock - item.quantity;
            await product.save();
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};
export const getAllOrders = async (req, res) => {};