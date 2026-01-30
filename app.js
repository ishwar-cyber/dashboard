import express from "express";
import cookieParser from "cookie-parser";
import{PORT} from "./config/env.js"
import cors from "cors";

import userRouter from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import productRouter from "./src/routes/product.routes.js";
import connectToDatabse from "./src/database/mongodb.js";
import {connectToPostgre} from "./src/database/db.connect.js";
import errorHandling from "./src/middleware/error.middleware.js";
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
import compression from "compression";
const app = express();
app.use(
  compression({
    level: 6,           // default is fine
    threshold: 1024     // compress responses > 1KB
  })
);
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: false,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

const allowedOrigins = [
  "https://application-shoppyness.vercel.app",
  "https://admin-mu-orcin.vercel.app",
  "http://localhost:4400","http://localhost:4200","https://merchant.cashfree.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authToken","x-visitor-id"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use("/api/payments/webhook", express.raw({ type: "*/*" }));
app.use('/', sitemapRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/brands', brandRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/coupons', couponRouter);
app.use('/api/v1/subcategory', subCategoryRouter);
app.use('/api/v1/pincode', pincodeRouter);
app.use('/api/v1/payment',paymentRoute);
app.use('/api/v1/reports', saleReportRouter);
app.use('/api/v1/antivirus', antivirusRouter);
app.use('/api/v1/reviews', productReviewRouter);
app.use('/api/v1/upload', uploadImageRouter);
app.get('/', (req,res)=>{
    res.send("shooppyness api working fine")
});

app.use(errorHandling);

app.listen(PORT,async()=>{
    console.log(`shoppyness api working http://localhost:${PORT}`);
   await connectToDatabse();
   await connectToPostgre();
   console.log("postreSQl connected");
})

export default app
