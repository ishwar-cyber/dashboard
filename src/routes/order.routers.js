import express from "express";
import authorize from "../middleware/auth.middlerwares.js";
import { order } from "../controllers/order.controllers.js";

const orderRouter = express.Router();

orderRouter.post('/', authorize, order);

export default orderRouter;