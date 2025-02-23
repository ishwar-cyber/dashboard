import OrderItem from "../modules/order_items.modules.js";
export const addToCart = async(req, res, next)=>{
    try {
       const {product, quntity} = req.body;
        const existingItem = await OrderItem.findOne({productId});
        if(existingItem){

        }
        let cartItem = new OrderItem({product, quntity});
        let saveOrderItem = await cartItem.save();
        res.status(201).json({
            success: true,
            data: saveOrderItem
        })
    } catch (error) {
        next(error)
    }
}