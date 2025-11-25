import axios from "axios"; // <-- missing import
import Order from "../models/order.model.js";
export const cashfreeWebhook = async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString()); // raw buffer → JSON

    const orderId = event.data.order.order_id;
    const paymentStatus = event.data.payment.payment_status; // SUCCESS, FAILED, PENDING

    // map Cashfree status to our status
    let finalStatus = "pending";
    if (paymentStatus === "SUCCESS") finalStatus = "success";
    if (paymentStatus === "FAILED") finalStatus = "failed";

    await Order.updateOne(
      { orderNumber: orderId },
      {
        paymentStatus: finalStatus,
        paymentInfo: event.data.payment,
      }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).send("Webhook Error");
  }
};


export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const url = `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    const response = await axios.get(url, {
      headers: {
         "x-client-id": "TEST43174731bcc18792591b7b55e3747134",
          "x-client-secret": "TEST9515edf6d8b1c6c1768721988ec4dcae903f6ed",
          "x-api-version": "2025-01-01",
          "Content-Type": "application/json",
      }
    });
    await updatePaymentStatus(orderId, response.data.order_status, response.data.payment);
    return res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("Cashfree Verify Error:", error.response?.data);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

export const updatePaymentStatus = async (orderId, status, paymentInfo) => {
  try {
    await Order.updateOne(
      { orderNumber: orderId },
      { paymentStatus: status, paymentInfo: paymentInfo }
    );
  } catch (error) {
    console.error("Update Payment Status Error:", error);
  }
}