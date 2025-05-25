import { Router } from "express";
import { addToCart, getCartItems, removeCartItem, increaseCartItemQuantity, decreaseCartItemQuantity } from "../controllers/order_item.controllers.js";

const orderItemsRouter = Router();

orderItemsRouter.post("/", addToCart);
orderItemsRouter.get("/:visitorId", getCartItems);
orderItemsRouter.delete("/:visitorId/:itemId", removeCartItem);
orderItemsRouter.put('/increase/:visitorId/:itemId', increaseCartItemQuantity);
orderItemsRouter.put('/decrease/:visitorId/:itemId', decreaseCartItemQuantity);


export default orderItemsRouter;