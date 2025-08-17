import { Router } from 'express';
import {addToCart, getCart, clearCart, updateCartItem, removeItemFromCart} from '../controllers/cart.controllers.js';

const cartRouter = Router();
cartRouter.get('/', getCart);
cartRouter.put('/update/:id/quantity', updateCartItem);
cartRouter.delete('/:id/remove', removeItemFromCart);
cartRouter.post('/add', addToCart);
cartRouter.delete('/clear', clearCart);


export default cartRouter; 
