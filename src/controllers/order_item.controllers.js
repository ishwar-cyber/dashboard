import Product from "../modules/product.modules.js";
import Cart from "../modules/cart.modules.js";
import { v4 as uuidv4 } from 'uuid';

export const addToCart = async (req, res, next) => {
    let visitorId = req.headers['visitor-id'];

    if (!visitorId) {
        visitorId = uuidv4();
        res.setHeader('visitor-id', visitorId);
    }

    const { product: productId, quantity } = req.body;

    try {
        // Validate input
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid productId or quantity' });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find the cart for the visitor
        let cart = await Cart.findOne({ visitorId });

        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ visitorId, items: [] });
        }

        // Check if the item is already in the cart
        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (existingItemIndex !== -1) {
            // Update quantity if the item already exists in the cart
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to the cart
            cart.items.push({ product: productId, quantity });
        }

        // Save the updated cart
        await cart.save();

        // Return the updated cart
        res.status(200).json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
};

export const getCartItems = async (req, res) => {
    const visitorId = req.headers['visitor-id'];

    if (!visitorId) {
        return res.status(400).json({ message: 'Visitor ID is required' });
    }

    try {
        const cart = await Cart.findOne({ visitorId }).populate('items.product');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({ message: 'Cart fetched successfully', cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};  

export const updateCartItem = async (req, res) => {
    const visitorId = req.headers['visitor-id'];
    const { product: productId, quantity } = req.body;

    if (!visitorId) {
        return res.status(400).json({ message: 'Visitor ID is required' });
    }

    try {
        // Validate input
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid productId or quantity' });
        }

        // Find the cart for the visitor
        const cart = await Cart.findOne({ visitorId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update the quantity
        cart.items[itemIndex].quantity = quantity;

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Cart item updated successfully', cart });
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
};
   
export const removeCartItem = async (req, res) => {
    const visitorId = req.headers['visitor-id'];
    const { product: productId } = req.body;

    if (!visitorId) {
        return res.status(400).json({ message: 'Visitor ID is required' });
    }

    try {
        // Validate input
        if (!productId) {
            return res.status(400).json({ message: 'Invalid productId' });
        }

        // Find the cart for the visitor
        const cart = await Cart.findOne({ visitorId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Remove the item from the cart
        cart.items.splice(itemIndex, 1);

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Cart item removed successfully', cart });
    } catch (error) {
        console.error("Error removing cart item:", error);
        res.status(500).json({ message: 'Error removing cart item', error: error.message });
    }
};