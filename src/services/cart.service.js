import errorHandler from '../middleware/error.middleware.js';
import Cart from '../modules/cart.modules.js';
import Product from '../modules/product.modules.js';
export const getOrCreateCart = async (userId) =>{
    try {
        
        let cart = await Cart.findOne({userId: userId, isActive: true}).populate({
            path: 'items.product',
            select: 'name price image'
        });
        if(!cart){
            cart = new Cart({
                userId: userId,
                items:[]
            })
            await cart.save();
        }
        return cart;
    } catch (error) {
        throw new Error(`Error getting cart: ${error.message}`);
    }
};
export const getCartByVisitorId = async (visitorId) => {
    try {
        let cart = await Cart.findOne({visitorId, isActive: true}).populate({
            path: 'items.product',
            select: 'name price stock images'
        });
        if(!cart){
            cart = new Cart({
                visitorId,
                items:[]
            })
            await cart.save();
        } 
        return cart;
    } catch (error) {
        throw new Error(`Error getting cart: ${error.message}`);
    }
}

export const addItemToCart = async (userId, item, visitorId) => {
  try {
    // ✅ Get cart (user or visitor)
    const cart = userId
      ? await getOrCreateCart(userId)
      : await getCartByVisitorId(visitorId);

    if (!cart) {
      throw new Error("Cart not found");
    }
    // ✅ Fetch product (with variants)
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error("Product not found");
    }

    // ✅ Determine stock
    let stock = product.stock;
    let variant = null;

    if (item.variantId) {
      variant = product.variants.id(item.variantId);
      if (!variant) {
        throw new Error("Variant not found");
      }
      stock = variant.stock;
    }
   
    // ✅ Find if same item already exists in cart
    let existingItem = cart.items.find((cartItem) => {
      return (
        cartItem.product._id.toString() === item.product.toString() &&
        (cartItem.variantId ? cartItem.variantId.toString() : null) ===
          (item.variantId ? item.variantId.toString() : null)
      );
    });
    if (existingItem) {
      // Update quantity
      const newQty = existingItem.quantity + item.quantity;
      if (newQty > stock) {
        throw new Error(`Only ${stock} items available in stock`);
      }
      existingItem.quantity = newQty;
    } else {
      // Insert new cart item
      if (item.quantity > stock) {
        throw new Error(`Only ${stock} items available in stock`);
      }
      cart.items.push(item);
    }

    // ✅ Update modified date
    cart.modifiedOn = new Date();

    // ✅ Save & return populated cart
    await cart.save();
    return await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price stock variants",
    });
  } catch (error) {
    console.error("addItemToCart Error:", error);
    throw error; // let API handler respond
  }
};


export const updateCartItemQuantity = async (userId, itemId, quantity, visitorId) => {
    try {
        const cart = userId ? userId : visitorId;
        
       const item = cart.items.id(itemId);
        
        if(!item){
            throw new Error('Item not found in cart', 404);
        }  
        const product = await Product.findById(item.product);
        if(!product){
            throw new Error('Product not found', 404);
        }
        
        if(quantity > product.stock){
            throw new errorHandler(`Only ${product.stock} items available in stock`, 400);
        }

        item.quantity += quantity;

        cart.modifiedOn = Date.now();

        await cart.save();
        
        let cartUpdated =  await Cart.findById(cart._id).populate("items.product","images price");
        return cartUpdated;
    } catch (error) {
        console.error(`Error updating cart item quantity: ${error.message}`);
        throw new Error(`Error updating cart item quantity: ${error.message}`);
    }
};  

export const removeItemCart = async (userId, visitorId, itemId) => {
    try {
        const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
        
        if(!cart.items.id(itemId)){
            throw new Error('Cart not found', 404);
        }
        cart.items.pull(itemId);
        cart.modifiedOn = Date.now();
        await cart.save();

        return await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price stock image'
        });
    } catch (error) {
        console.error(`Error removing item from cart: ${error.message}`);
        throw new Error(`Error removing item from cart: ${error.message}`);
    }
};

export const clearCartFromCart = async (userId, visitorId) => {
    try {
        const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
        
        if(!cart){
            throw new Error('Cart not found', 404);
        }

        cart.items = [];
        cart.modifiedOn = Date.now();
        await cart.save();

        return cart;
    } catch (error) {
        console.error(`Error clearing cart: ${error.message}`);
        throw new Error(`Error clearing cart: ${error.message}`);
    }
};

export const applyCoupon1 = async (userId, visitorId, couponCode) => {
    try {
        const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
        
        if(!cart){
            throw new Error('Cart not found', 404);
        }

        // Assuming you have a function to validate the coupon code
        const discount = await validateCoupon(couponCode);
        
        if(!discount){
            throw new Error('Invalid coupon code', 400);
        }

        cart.discount = discount;
        cart.modifiedOn = Date.now();
        await cart.save();

        return await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price stock image'
        });
    } catch (error) {
        console.error(`Error applying coupon: ${error.message}`);
        throw new Error(`Error applying coupon: ${error.message}`);
    }
};


export const applyCoupon = async (userId, visitorId, couponCode) => {
  try {
    const cart = userId
      ? await getOrCreateCart(userId)
      : await getCartByVisitorId(visitorId);

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const discount = await validateCoupon(couponCode);
    if (!discount) {
      throw new ApiError(400, "Invalid or expired coupon code");
    }

    // Save discount info on cart
    cart.discount = discount;
    cart.modifiedOn = Date.now();
    await cart.save();

    return await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price stock image",
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    if (error instanceof ApiError) {
      throw error; // rethrow with status code
    }
    throw new ApiError(500, "Internal server error");
  }
}