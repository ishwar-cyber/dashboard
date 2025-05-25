import Product from "../modules/product.modules.js";
import Cart from "../modules/cart.modules.js";
 
export const addToCart = async (req, res, next) => {
  const { items } = req.body;
    try {
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }
        const visitorId = req.body.visitorId;
        const { product: productId, quantity } = items[0];
        console.log("Visitor ID:", items[0]);
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        let cart = await Cart.findOne({ visitorId });
        if (!cart) {
            cart = new Cart({ visitorId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }
        await cart.save();

        res.status(200).json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
};

export const getCartItems = async (req, res) => {
    const visitorId = req.params.visitorId;
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
    const { visitorId, itemId: itemId } = req.params;

    // Validate required parameters
    if (!visitorId) {
        return res.status(400).json({ 
            success: false,
            message: 'Visitor ID is required',
            error: 'MISSING_VISITOR_ID'
        });
    }

    if (!itemId) {
        return res.status(400).json({ 
            success: false,
            message: 'Product ID is required',
            error: 'MISSING_PRODUCT_ID'
        });
    }

    try {
        // Find and update the cart in one operation
        const updatedCart = await Cart.findOneAndUpdate(
            { visitorId },
            { $pull: { items: { _id: _id } } },
            { new: true }
        );
        
        console.log("Updated Cart:", updatedCart);
        
        if (!updatedCart) {
            return res.status(404).json({ 
                success: false,
                message: 'Cart not found',
                error: 'CART_NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cart item removed successfully',
            data: {
                cart: updatedCart,
                removedItemId: productId
            }
        });

    } catch (error) {
        console.error("Error removing cart item:", error);
        
        // Handle specific error types if needed
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                error: 'INVALID_ID_FORMAT'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error while removing cart item',
            error: 'INTERNAL_SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const clearCart = async (req, res) => {
    const visitorId = req.params.visitorId;

    if (!visitorId) {
        return res.status(400).json({ message: 'Visitor ID is required' });
    }

    try {
        const cart = await Cart.findOneAndDelete({ visitorId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};

export const increaseCartItemQuantity = async (req, res) => {
    const visitorId = req.params.visitorId;
    const itemId = req.params.itemId;
    if (!visitorId)   return res.status(400).json({ message: 'Visitor ID is required' });
    try {
        // Validate input
        if(!itemId) return res.status(400).json({ message: 'Invalid productId' });
        // Find the cart for the visitor
        const cart = await Cart.findOne({ visitorId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        for(let item of cart.items){
            if(item._id.toString() === itemId.toString()){
                 item.quantity += 1;
            }
        }
        // Save the updated cart
        await cart.save();
        res.status(200).json({ message: 'Cart item quantity increased successfully', cart });
    } catch (error) {
        console.error("Error increasing cart item quantity:", error);
        res.status(500).json({ message: 'Error increasing cart item quantity', error: error.message });
    }
};

export const decreaseCartItemQuantity = async (req, res) => {
   const visitorId = req.params.visitorId;
    const itemId = req.params.itemId;
    if (!visitorId)   return res.status(400).json({ message: 'Visitor ID is required' });
    try {
        // Validate input
        if(!itemId) return res.status(400).json({ message: 'Invalid productId' });
        // Find the cart for the visitor
        const cart = await Cart.findOne({ visitorId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        for(let item of cart.items){
            if(item._id.toString() === itemId.toString()){
                 if (item.quantity > 1) {
                    item.quantity -= 1;
                 } else {
                    return res.status(400).json({ message: 'Quantity cannot be less than 1' });
                 }
            }
        }

        // Decrease the quantity
       

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Cart item quantity decreased successfully', cart });
    } catch (error) {
        console.error("Error decreasing cart item quantity:", error);
        res.status(500).json({ message: 'Error decreasing cart item quantity', error: error.message });
    }
};

