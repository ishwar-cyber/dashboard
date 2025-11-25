import { Router } from "express";
import { cashfreeWebhook, getPaymentStatus } from "../controllers/payment.controller.js";

const paymentRoute = Router();

paymentRoute.post('/webhook', cashfreeWebhook);
paymentRoute.get('/status/:orderId', getPaymentStatus);
export default paymentRoute;