
import Product from '../modules/product.modules.js';
import Cart from '../modules/cart.modules.js';
import User from '../modules/user.modules.js';
import { getIds } from '../utilities/checkUserAndVisitor.js';
import { addItemToCart, updateCartItemQuantity, removeItemCart, applyCoupon } from '../services/cart.service.js' 
import { calculatedCart } from '../services/cart.calculater.service.js';

export const addToCart = async (req, res) => {
    try {
      const {productId, quantity = 1} = req.body;
      const validation =  (await getIds(req));
      const userId = validation.userId;
      const visitorId = validation.visitorId;
        // ✅ Build query dynamically
      let query = null;
      if (userId) {
        query = { userId };
      } else if (visitorId) {
        query = { visitorId };
      }

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
    const validation =  (await getIds(req));
    const userId = validation.userId;
    const visitorId = validation.visitorId;
      // ✅ Build query dynamically
    let query = null;
    if (userId) {
      query = { userId };
    } else if (visitorId) {
      query = { visitorId };
    }

    // If no identifiers → return empty cart safely
    if (!query) {
      return res.status(200).json({
        message: "Get all Cart",
        success: true,
        data: { items: [] }
      });
    }

    const cart = await Cart.findOne(query)
      .populate("items.product", "stock images slug");

    res.status(200).json({
      message: "Get all Cart",
      success: true,
      data: cart || { items: [] }
    });
  } catch (error) {
    console.error(`Error fetching cart: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const clearCart = async (req, res) => {
 const validation =  (await getIds(req));
  const userId = validation.userId;
  const visitorId = validation.visitorId;
    // ✅ Build query dynamically
  let query = null;
  if (userId) {
    query = { userId };
  } else if (visitorId) {
    query = { visitorId };
  }
  const cart = await Cart.find({ $or: [{ userId }, { visitorId }] });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ items: [] });
};

export const removeItemFromCart = async (req, res) => {    
  const { id } = req.params;
  const validation =  (await getIds(req));
  const userId = validation.userId;
  const visitorId = validation.visitorId;
    // ✅ Build query dynamically
  let query = null;
  if (userId) {
    query = { userId };
  } else if (visitorId) {
    query = { visitorId };
  }

  let cart = await Cart.findOne({ $or: [{ userId }, { visitorId }] }).populate("items.product","images price");
  if (cart) {
    cart.items = cart.items.filter(
      item => item._id.toString() !== id
    );
    await cart.save();
  }
  res.status(200).json({
    success: true,
    message: 'Remove item form cart',
    data: cart
  })
};


export const updateCartQuantity = async (req, res) => {
    try {
        
      const validation =  (await getIds(req));
      const userId = validation.userId;
      const visitorId = validation.visitorId;
        // ✅ Build query dynamically
      let query = null;
      if (userId) {
        query = { userId };
      } else if (visitorId) {
        query = { visitorId };
      }
        const { id } = req.params;
        const { quantity } = req.body;  

        if(!userId && !visitorId){
            return res.status(400).json({ success: false, message: 'User or Visitor ID is required' });
        }
        if(!quantity && quantity !== 0) {
            return res.status(400).json({ success: false, message: 'Quantity is required' });
        }
        if(quantity === 0) {
            await removeItemCart(userId, visitorId, id);
            return res.status(200).json({ success: true, message: 'Item removed from cart' });
        }

        const cart = await updateCartItemQuantity(userId, id, quantity, visitorId);

        res.status(200).json({
            success: true,
            message: 'Cart item quantity updated',
            data: cart
        });
    } catch (error) {
        console.error(`Error updating cart item quantity: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateCartItem = async (req, res) => {
  try {
     const { id } = req.params;
     const { quantity } = req.body;   // quantity can be absolute or relative
    const { userId, visitorId } = getIds(req); // your function to get IDs

    if (!id || quantity == null) {
      return res.status(400).json({ success: false, message: "Product ID and quantity are required" });
    }

    // Find the correct cart
    const cart = await Cart.findOne({
      $or: [{ userId }, { visitorId }]
    }).populate("items.product","images price");

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      (item) => item.id.toString() === id
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }
    // Update quantity (absolute update)
    cart.items[itemIndex].quantity = quantity;
    // Save updated cart
    await cart.save();
    res.json({
      success: true,
      message: "Quantity updated successfully",
      data: cart
    });

  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const applyCoupons = async (req, res) => {
    try {
    const validation =  (await getIds(req));
    const userId = validation.userId;
    const visitorId = validation.visitorId;
      // ✅ Build query dynamically
    let query = null;
    if (userId) {
      query = { userId };
    } else if (visitorId) {
      query = { visitorId };
    }
      const { code } = req.body;
      const cart = await applyCoupon(userId, visitorId, code);
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
