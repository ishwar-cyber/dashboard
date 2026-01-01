import Product from "../models/product.model.js";

export const calculatedCart = async(cart) => {
    if(!cart) return null;
    try {
        const calculateCart = JSON.parse(JSON.stringify(cart));
        let itemCount = 0;
        let subTotal = 0;
        let total = 0;
        let totalDiscount = 0;
        
        if(calculateCart.items && calculateCart.items.length > 0){
            calculateCart.items = calculateCart.items.map(item =>{              
                const discountedPrice = item.price * (1-(item.discount || 0) / 100);
                subTotal += (item.price * item.quantity); // Including a flat shipping of 100 per item
                total += (discountedPrice * item.quantity) + 100;
                itemCount += item.quantity;
                const itemDiscount = item.price * ((item.discount || 0) / 100) * item.quantity;
                totalDiscount += itemDiscount;
                return {
                    ...item
                };
            });
        }
         // Update the cart with calculated values
        
        return {
            ...calculateCart
        };
    } catch (error) {
        console.error(`Error calculating cart: ${error.message}`);
        return null;
    }
}