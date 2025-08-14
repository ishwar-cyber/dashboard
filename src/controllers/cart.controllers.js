import Product from '../modules/product.modules.js';
import { addItemToCart, updateCartItemQuantity, removeItemCart, applyCoupon, clearCartFromCart } from '../services/cart.service.js' 
import { calculatedCart } from '../services/cart.calculater.service.js';
import { getOrCreateCart, getCartByVisitorId } from '../services/cart.service.js';
export const addToCart = async (req, res) => {
    try {
        const {productId, quantity = 1} = req.body;
        const userId =req.user?.id;
        const visitorId = req.visitorId;
        if(!productId){
            return res.status(400).json({ success: false, message: 'Product id is Required' });
        }

        if(quantity <= 0) return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });

        const product = await Product.findById(productId);
 
        
        if(!product){
            return res.status(400).json({ success: false, message: 'Product not found' });
        }
        if(Number(product.stock) < quantity){
            return res.status(400).json({ success: false, message: 'Not enough stock available' });
        }
        const cart = await addItemToCart(userId, {
            product: product.id,
            name: product.name,
            image: product.productImages,
            price: product.price,
            discount: product.discount,
            quantity
        }, visitorId);

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: cart
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const getCart = async (req, res) => {
    try {
        console.log('visiter id', req.visitorId);
    
    } catch (error) {
        console.error(`Error fetching cart: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const visitorId = req.visitorId;

        if(!userId && !visitorId){
            return res.status(400).json({ success: false, message: 'User or Visitor ID is required' });
        }

        const cart = await clearCartFromCart(userId, visitorId);

        if(!cart){
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: await calculatedCart(cart)
        });
    } catch (error) {
        console.error(`Error clearing cart: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const removeItemFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const visitorId = req.visitorId;
        const { itemId } = req.params;

        const cart =  await removeItemCart(userId, visitorId, itemId);
        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: await calculatedCart(cart)
        });
    } catch (error) {
        console.error(`Error removing item from cart: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const visitorId = req.visitorId;
        const { itemId } = req.params;
        const { quantity } = req.body;  

        if(!userId && !visitorId){
            return res.status(400).json({ success: false, message: 'User or Visitor ID is required' });
        }
        if(!quantity && quantity !== 0) {
            return res.status(400).json({ success: false, message: 'Quantity is required' });
        }
        if(quantity === 0) {
            await removeItemCart(userId, visitorId, itemId);
            return res.status(200).json({ success: true, message: 'Item removed from cart' });
        }

        const cart = await updateCartItemQuantity(userId, itemId, quantity, visitorId);

        res.status(200).json({
            success: true,
            message: 'Cart item quantity updated',
            data: await calculatedCart(cart)
        });
    } catch (error) {
        console.error(`Error updating cart item quantity: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const applyCoupons = async (req, res) => {
    try {
        const userId = req.user?.id;
        const visitorId = req.visitorId;
        const { couponCode } = req.body;
        const cart = await applyCoupon(userId, visitorId, couponCode);
        if(!cart) {
            return res.status(404).json({ success: false, message: 'Cart calculation failed' });
        }
        // Assuming applyCoupon is a function that applies the coupon to the cart

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            data: await calculatedCart(cart)
        });
    } catch (error) {
        console.error(`Error applying coupon: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
