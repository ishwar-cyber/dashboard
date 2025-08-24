// utils/email.js
import nodemailer from "nodemailer";

export const sendOrderEmail = async (email, order) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io", // replace with your SMTP server
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const html = `
    <h3>Order Confirmation</h3>
    <p>Thank you for your order!</p>
    <p>Order ID: ${order._id}</p>
    <p>Total: ₹${order.totalAmount}</p>
  `;

  await transporter.sendMail({
    from: '"Shop Name" <no-reply@shop.com>',
    to: email,
    subject: "Your Order Confirmation",
    html,
  });
};
