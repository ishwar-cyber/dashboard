import { Router } from 'express';
import {addToCart, getCart, updateCartItem, removeItemFromCart} from '../controllers/cart.controllers.js';

const cartRouter = Router();
cartRouter.get('/', getCart);
cartRouter.put('/:itemId', updateCartItem);
cartRouter.delete('/:itemId', removeItemFromCart);
cartRouter.post('/', addToCart);


export default cartRouter; 
