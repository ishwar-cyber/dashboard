import { Router } from "express";
import { createOrder } from "../controllers/payment.controller.js";

const paymentRoute = Router();

paymentRoute.post('/create-order',createOrder);

export default paymentRoute;