import Cart from '../modules/cart.modules.js';
import Product from '../modules/product.modules.js';
import { validateObjectId } from '../utilities/validation.js';

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private/Public
 */
export const addToCart = async (req, res) => {
    console.log('product id req', req.body.items[0]);
    
    try {
        // console.log('productId', req.body);
        
        const { productId, quantity = 1 } = req.body.items[0];
        const { visitorId } = req.params;
        const userId = req.user?._id;
        // console.log('productId',productId);
        
        // Validate input
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        if (!visitorId) {
            return res.status(400).json({
                success: false,
                message: 'Visitor ID is required'
            });
        }

        if (quantity < 1 || quantity > 999) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 999'
            });
        }
        console.log('find product id', productId);
        
        // Check if product exists and is available
        const product = await Product.exists({ _id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId });;
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                currency: 'INR'
            });
        }

        // Add item to cart
        cart.items.push({
            product: productId,
            quantity,
            price: product.price
        });
        await cart.save();

        // Populate product details
        await cart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku'
        });

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                total: cart.total,
                items: cart.items
            }
        });

    } catch (error) {
        // console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
};

/**
 * @desc    Get cart items
 * @route   GET /api/cart/:visitorId
 * @access  Private/Public
 */
export const getCartItems = async (req, res) => {
    try {
        const { visitorId } = req.params;
        console.log('user ', req.get());
        
        const userId = req.user?._id;

        // if (!visitorId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Visitor ID is required'
        //     });
        // }

        const cart = await Cart.findByUser(userId, visitorId);
        
        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                data: {
                    items: [],
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    total: 0
                }
            });
        }

        // Populate product details
        await cart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku description'
        });

        res.status(200).json({
            success: true,
            message: 'Cart retrieved successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                tax: cart.tax,
                shipping: cart.shipping,
                total: cart.total,
                currency: cart.currency,
                items: cart.items,
                lastUpdated: cart.updatedAt
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cart',
            error: error.message
        });
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:visitorId/:productId
 * @access  Private/Public
 */
export const updateCartItemQuantity = async (req, res) => {
    try {
        const { visitorId, productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user?._id;

        // Validate input
        if (!validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        if (!quantity || quantity < 1 || quantity > 999) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 999'
            });
        }

        // Check product stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
            });
        }

        // Find cart and update quantity
        const cart = await Cart.findByUser(userId, visitorId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.updateItemQuantity(productId, quantity);
        await cart.save();

        // Populate product details
        await cart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku'
        });

        res.status(200).json({
            success: true,
            message: 'Cart item quantity updated successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                total: cart.total,
                items: cart.items
            }
        });

    } catch (error) {
        console.error('Update cart quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item quantity',
            error: error.message
        });
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:visitorId/:productId
 * @access  Private/Public
 */
export const removeCartItem = async (req, res) => {
    try {
        const { visitorId, productId } = req.params;
        const userId = req.user?._id;

        if (!validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        const cart = await Cart.findByUser(userId, visitorId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.removeItem(productId);
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                total: cart.total
            }
        });

    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart/:visitorId
 * @access  Private/Public
 */
export const clearCart = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const userId = req.user?._id;

        const cart = await Cart.findByUser(userId, visitorId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.clearCart();
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                cartId: cart._id,
                itemCount: 0,
                subtotal: 0,
                total: 0
            }
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
};

/**
 * @desc    Get cart count
 * @route   GET /api/cart/:visitorId/count
 * @access  Private/Public
 */
export const getCartCount = async (req, res) => {
    try {
        const { visitorId } = req.params;
        const userId = req.user?._id;

        const cart = await Cart.findByUser(userId, visitorId);
        
        const itemCount = cart ? cart.itemCount : 0;

        res.status(200).json({
            success: true,
            data: {
                itemCount,
                hasItems: itemCount > 0
            }
        });

    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart count',
            error: error.message
        });
    }
};

/**
 * @desc    Merge guest cart with user cart
 * @route   POST /api/cart/merge
 * @access  Private
 */
export const mergeGuestCart = async (req, res) => {
    try {
        const { visitorId } = req.body;
        const userId = req.user._id;

        if (!visitorId) {
            return res.status(400).json({
                success: false,
                message: 'Visitor ID is required'
            });
        }

        // Find guest cart
        const guestCart = await Cart.findOne({ visitorId, isActive: true });
        if (!guestCart) {
            return res.status(200).json({
                success: true,
                message: 'No guest cart to merge'
            });
        }

        // Find or create user cart
        let userCart = await Cart.findOne({ userId, isActive: true });
        if (!userCart) {
            userCart = new Cart({
                userId,
                visitorId: `user_${userId}`,
                items: [],
                currency: 'INR'
            });
        }

        // Merge items from guest cart to user cart
        for (const guestItem of guestCart.items) {
            userCart.addItem(
                guestItem.product,
                guestItem.quantity,
                guestItem.price,
                
            );
        }

        await userCart.save();

        // Deactivate guest cart
        guestCart.isActive = false;
        await guestCart.save();

        // Populate product details
        await userCart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku'
        });

        res.status(200).json({
            success: true,
            message: 'Guest cart merged successfully',
            data: {
                cartId: userCart._id,
                itemCount: userCart.itemCount,
                subtotal: userCart.subtotal,
                total: userCart.total,
                items: userCart.items
            }
        });

    } catch (error) {
        console.error('Merge cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to merge guest cart',
            error: error.message
        });
    }
}; 

/**
 * @desc    Decrease cart item quantity by 1
 * @route   PUT /api/cart/:visitorId/:productId/decrease
 * @access  Private/Public
 */
export const decreaseCartItemQuantity = async (req, res) => {
    try {
        const { visitorId, productId } = req.params;
        const userId = req.user?._id;

        if (!validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        // Find cart
        const cart = await Cart.findByUser(userId, visitorId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the item
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        if (item.quantity <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity cannot be less than 1. Use remove to delete the item.'
            });
        }

        // Decrease quantity
        cart.updateItemQuantity(productId, item.quantity - 1);
        await cart.save();

        // Populate product details
        await cart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku'
        });

        res.status(200).json({
            success: true,
            message: 'Cart item quantity decreased successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                total: cart.total,
                items: cart.items
            }
        });
    } catch (error) {
        console.error('Decrease cart quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decrease cart item quantity',
            error: error.message
        });
    }
}; 

/**
 * @desc    Increase cart item quantity by 1
 * @route   PUT /api/cart/:visitorId/:productId/increase
 * @access  Private/Public
 */
export const increaseCartItemQuantity = async (req, res) => {
    try {
        const { visitorId, productId } = req.params;
        const userId = req.user?._id;

        if (!validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        // Find cart
        const cart = await Cart.findByUser(userId, visitorId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the item
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Check product stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        if (product.stock < item.quantity + 1) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity + 1}`
            });
        }

        // Increase quantity
        cart.updateItemQuantity(productId, item.quantity + 1);
        await cart.save();

        // Populate product details
        await cart.populate({
            path: 'items.product',
            select: 'name price thumbnail stock sku'
        });

        res.status(200).json({
            success: true,
            message: 'Cart item quantity increased successfully',
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                total: cart.total,
                items: cart.items
            }
        });
    } catch (error) {
        console.error('Increase cart quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to increase cart item quantity',
            error: error.message
        });
    }
}; 