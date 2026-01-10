import { getIds } from '../utilities/checkUserAndVisitor.js';
import { addItemToCart, updateCartItemQuantity, removeItemCart, applyCoupon, getCartByVisitorId, getOrCreateCart } from '../services/cart.service.js';
import { calculatedCart } from '../services/cart.calculater.service.js';

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;

    const validation = await getIds(req);
    const userId = validation.userId;
    const visitorId = validation.visitorId;

    if (!productId) return res.status(400).json({ success: false, message: 'Product id is required' });
    if (quantity <= 0) return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });

    const cart = await addItemToCart(userId, { productId, variantId, quantity }, visitorId);

    res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
  } catch (error) {

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCart = async (req, res) => {
  try {
    const validation =  (await getIds(req));
    const userId = validation.userId;
    const visitorId = validation.visitorId;
      // ✅ Build query dynamically
    // If no identifiers → return empty cart safely
    if (!userId && !visitorId) {
      return res.status(200).json({ message: 'Get all Cart', success: true, data: { items: [] } });
    }

    let cart = null;
    if (userId) {
      cart = await getOrCreateCart(userId);
    } else if (visitorId) {
      cart = await getCartByVisitorId(visitorId);
    }

    res.status(200).json({ message: 'Get all Cart', success: true, data: cart || { items: [] } });
  } catch (error) {

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
  const cart = await Cart.findOne(query);
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ items: [] });
};

export const removeItemFromCart = async (req, res) => {
  try {
    const { id } = req.params; // this should be cartItemId, not productId

    const validation = await getIds(req);
    const userId = validation.userId;
    const visitorId = validation.visitorId;

    // ✅ Pick correct query
    const query = userId ? { userId } : { visitorId };

    const cart = await Cart.findOne(query);
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // ✅ Remove item by subdocument _id
    const item = cart.items.id(id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    item.deleteOne(); // or cart.items.pull(id);
    await cart.save();

    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {

    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
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
   
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateCartItem = async (req, res) => {
  try {
    const validation = await getIds(req);
    const userId = validation.userId;
    const visitorId = validation.visitorId;

    const { id } = req.params;           // cart item _id
    const { quantity } = req.body;       // new quantity

    if (!id || quantity == null) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    // ✅ Build a safe Mongo query
    const query = { $or: [] };
    if (userId) query.$or.push({ userId });
    if (visitorId) query.$or.push({ visitorId });

    if (query.$or.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing user/visitor ID",
      });
    }

    // ✅ Find the user's cart
    const cart = await Cart.findOne(query).populate("items.product", "images price name");
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // ✅ Find the cart item index
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === id.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // ✅ Update or remove the item
    cart.items[itemIndex].quantity = quantity;
    if (quantity <= 0) cart.items.splice(itemIndex, 1);

    await cart.save();

    res.json({
      success: true,
      message: "Quantity updated successfully",
      data: cart,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const applyCoupons = async (req, res) => {
    try {
      const validation = await getIds(req);
      const userId = validation.userId;
      const visitorId = validation.visitorId;
      // ✅ Build query dynamically
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
   
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
