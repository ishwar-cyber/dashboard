
import Cart from '../modules/cart.modules.js';
import Product from '../modules/product.modules.js';
export const getOrCreateCart = async (userId) =>{
    try {
        
        let cart = await Cart.findOne({user: userId, isActive: true}).populate({
            path: 'items.product',
            select: 'name price image'
        });
        if(!cart){
            cart = new Cart({
                user:userId,
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
            select: 'name price stock image'
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
    // Get the cart
    const cart = userId
      ? await getOrCreateCart(userId)
      : await getCartByVisitorId(visitorId);

    if (!cart) {
      throw new Error("Cart not found");
    }
    const product = await Product.findById(item.product);
    // console.log('produc tid ponmkn', product);
    
    if (!product) {
      throw new Error("Product not found");
    }

    let existingItem = cart.items.find(
        cartItem => cartItem.product.id.toString() === item.product.toString()
    );   
      // Update quantity
      let storeQuantity = '';
      console.log('dfghjkl;', existingItem);
      
        if(existingItem){
            for(let cartItem of cart.items){
                if(cartItem.product.id === item.product) {
                    storeQuantity = cartItem.quantity + item.quantity;
                    if (storeQuantity > product.stock) {
                        throw new Error(`Only ${product.stock} items available in stock`);
                    }
                    cartItem.quantity = storeQuantity;
                }
            }
        } else {
            if (item.quantity > product.stock) throw new Error(`Only ${product.stock} items available in stock`);
            cart.items.push(item);
        }

    // Update modified date
    cart.modifiedOn = new Date();

    // Save and return populated cart
    await cart.save();
    return await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price stock image'
    });
  } catch (error) {
    console.error(error);
    throw error; // rethrow for API error handler
  }
};


export const updateCartItemQuantity = async (userId, itemId, quantity, visitorId) => {
    try {
        const cart = userId ? await getOrCreateCart(userId) : await getCartByVisitorId(visitorId);
        
        const item = cart.items.id(itemId);
        
        if(!item){
            throw new Error('Item not found in cart', 404);
        }  
        const product = await Product.findById(item.product);
        if(!product){
            throw new Error('Product not found', 404);
        }
        
        if(quantity > product.stock){
            throw new Error(`Only ${product.stock} items available in stock`, 400);
        }

        item.quantity += quantity;

        cart.modifiedOn = Date.now();

        await cart.save();
        
        return await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price stock image'
        });
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

export const applyCoupon = async (userId, visitorId, couponCode) => {
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
