import { Router } from "express";
import { createOrderPayment, cashfreeWebhook } from "../controllers/payment.controller.js";

const paymentRoute = Router();

paymentRoute.post('/create-order',createOrderPayment);
paymentRoute.post('/webhook', cashfreeWebhook);
export default paymentRoute;