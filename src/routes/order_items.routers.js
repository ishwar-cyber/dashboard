import { Router } from "express";
import { addToCart, getCartItems, removeCartItem } from "../controllers/order_item.controllers.js";
import { get } from "mongoose";

const orderItemsRouter = Router();

orderItemsRouter.post("/", addToCart);
orderItemsRouter.get("/cart/:visitorId", getCartItems);
orderItemsRouter.delete("/cart/:visitorId", removeCartItem);

export default orderItemsRouter;