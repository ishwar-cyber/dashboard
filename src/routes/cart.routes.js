import { Router } from 'express';
import {addToCart, getCart, clearCart, updateCartItem, removeItemFromCart} from '../controllers/cart.controllers.js';
import { generateVisitorId } from '../middleware/visitor.middleware.js'
const cartRouter = Router();
// ✅ Apply visitor middleware only for non-auth routes
cartRouter.use(generateVisitorId);
cartRouter.get('/', getCart);
cartRouter.put('/update/:id/quantity', updateCartItem);
cartRouter.delete('/:id/remove', removeItemFromCart);
cartRouter.post('/add', addToCart);
cartRouter.delete('/clear', clearCart);


export default cartRouter; 
