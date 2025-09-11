import { CASHFREE_BASE_URL, CASHFREE_APP_ID, CASHFREE_SECRET_KEY} from "../../config/env.js";.3
import axios from "axios"; // <-- missing import
export const createOrder = async (req, res) => {
 try {
    const { orderId, amount, customerName, customerPhone, customerEmail } = req.body;

    // Step 1: Create order with Cashfree API
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "CUST_" + Date.now(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `https://application-shoppyness.vercel.app/payment-status?order_id={orderId}`,
        },
      },
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
    });
  } catch (error) {
    console.error("Error creating Cashfree order:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const cashfreeWebhook = async (req, res) => {
  try {
    const { order_id, order_status } = req.body;

    const order = await Order.findOne({ orderId: order_id });
    if (order) {
      order.status = order_status.toLowerCase(); // PAID, FAILED
      await order.save();
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
};
