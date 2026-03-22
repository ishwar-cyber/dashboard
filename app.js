import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";

import userRouter from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import productRouter from "./src/routes/product.routes.js";
import brandRouter from "./src/routes/brand.routers.js";
import categoryRouter from "./src/routes/category.routers.js";
import orderRouter from "./src/routes/order.routes.js";
import cartRouter from "./src/routes/cart.routes.js";
import couponRouter from "./src/routes/coupon.routers.js";
import subCategoryRouter from "./src/routes/sub_category.routes.js";
import pincodeRouter from "./src/routes/service_pincode.routers.js";
import paymentRoute from "./src/routes/payment.routes.js";
import sitemapRouter from "./src/routes/sitemap.routes.js";
import saleReportRouter from "./src/routes/sale-reports.routers.js";
import antivirusRouter from "./src/routes/antivirus.routes.js";
import productReviewRouter from "./src/routes/product-review.routes.js";
import uploadImageRouter from "./src/routes/upload-image.js";

import errorHandling from "./src/middleware/error.middleware.js";
import { connectToPostgre } from "./src/database/db.connect.js";

// ❗ Always prefer Railway PORT
const PORT = process.env.PORT || 8000;

const app = express();

// Compression
app.use(
  compression({
    level: 6,
    threshold: 1024
  })
);

// Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// Static
app.use(express.static("public"));

// Cookies
app.use(cookieParser());

// CORS
const allowedOrigins = [
  "https://application-shoppyness.vercel.app",
  "https://admin-mu-orcin.vercel.app",
  "http://localhost:4400",
  "http://localhost:4200",
  "https://merchant.cashfree.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authToken", "x-visitor-id"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Special route (before JSON parser conflict)
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

// Routes
app.use("/", sitemapRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/subcategory", subCategoryRouter);
app.use("/api/v1/pincode", pincodeRouter);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/reports", saleReportRouter);
app.use("/api/v1/antivirus", antivirusRouter);
app.use("/api/v1/reviews", productReviewRouter);
app.use("/api/v1/upload", uploadImageRouter);

// Health check route (VERY IMPORTANT for Railway)
app.get("/", (req, res) => {
  res.send("shoppyness api working fine");
});

// Error handler
app.use(errorHandling);

// ✅ Proper startup flow
const startServer = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await connectToPostgre();
    console.log("PostgreSQL connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
};

startServer();

export default app;
