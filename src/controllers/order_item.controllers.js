import Product from "../modules/product.modules.js";
export const addToCart = async(req, res, next)=>{
    let cart = [];
    const { product, quantity } = req.body;
    console.log('product', req.body);
    // // Validate input
    // if (!product || !quantity || quantity <= 0) {
    //     return res.status(400).json({ message: 'Invalid productId or quantity' });
    // }

    // Check if the item is already in the cart
    const existingItemIndex = cart.findIndex(item => item.product === product._id);
    const productObj = Product.findById(product._id); 
    console.log('productObj', productObj);
    
    if (existingItemIndex !== -1) {
        // Update quantity if the item already exists in the cart
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to the cart
        cart.push({ product, quantity });
    }

    // Return the updated cart
    res.status(200).json({ message: 'Item added to cart', cart });
}