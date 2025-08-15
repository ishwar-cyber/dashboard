import { Router } from 'express';
import {addToCart, getCart, clearCart, updateCartItem, removeItemFromCart} from '../controllers/cart.controllers.js';

const cartRouter = Router();
cartRouter.get('/', getCart);
cartRouter.put('/update/:id', updateCartItem);
cartRouter.delete('/remove/:id', removeItemFromCart);
cartRouter.post('/', addToCart);
cartRouter.delete('/clear', clearCart);


export default cartRouter; 
