import { Router } from "express";
import { addToCart } from "../controllers/order_item.controllers.js";

const orderItemsRouter = Router();

orderItemsRouter.post("/", addToCart);
orderItemsRouter.get("/", (req, res) => {    
  res.send("Order items route");
});

export default orderItemsRouter;