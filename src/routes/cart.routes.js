import { Router } from 'express';
import {addToCart, updateCartItem, removeItemFromCart} from '../controllers/cart.controllers.js';
import { tokenVerify } from '../middleware/auth.middlerwares.js';
import { identifyVisitor, requireIdentification } from '../middleware/visitor.middleware.js';

const cartRouter = Router();
cartRouter.use(identifyVisitor);
cartRouter.use(requireIdentification);

cartRouter.post('/', addToCart);
cartRouter.put('/:itemId', updateCartItem);
cartRouter.delete('/:itemId', removeItemFromCart);


export default cartRouter; 