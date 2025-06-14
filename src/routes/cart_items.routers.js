import { Router } from "express";
import { addToCart, getCartItems, removeCartItem, getCartItemCount, increaseCartItemQuantity, decreaseCartItemQuantity } from "../controllers/order_item.controllers.js";

const cartItemsRouter = Router();

cartItemsRouter.post("/", addToCart);
cartItemsRouter.get("/:visitorId", getCartItems);
cartItemsRouter.get("/count/:visitorId", getCartItemCount);
cartItemsRouter.delete("/:visitorId/:itemId", removeCartItem);
cartItemsRouter.put('/increase/:visitorId/:itemId', increaseCartItemQuantity);
cartItemsRouter.put('/decrease/:visitorId/:itemId', decreaseCartItemQuantity);


export default cartItemsRouter;