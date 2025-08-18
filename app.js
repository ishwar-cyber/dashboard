import express from "express";
import cookieParser from "cookie-parser";
import{PORT} from "./config/env.js"
import cors from "cors";

import userRouter from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import productRouter from "./src/routes/product.routes.js";
import connectToDatabse from "./src/database/mongodb.js";
import errorHandling from "./src/middleware/error.middleware.js";
import brandRouter from "./src/routes/brand.routers.js";
import categoryRouter from "./src/routes/category.routers.js";
import orderRouter from "./src/routes/order.routes.js";
import cartRouter from "./src/routes/cart.routes.js";
import couponRouter from "./src/routes/coupon.routers.js";
import subCategoryRouter from "./src/routes/sub_category.routes.js";
import pincodeRouter from "./src/routes/service_pincode.routers.js";
import { generateVisitorIds } from './src/middleware/visitor.middleware.js';

const app = express();

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: false,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

const allowedOrigins = [
  "https://application-shoppyness.vercel.app",
  "https://admin-mu-orcin.vercel.app"
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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authToken"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(generateVisitorIds);

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




app.get('/', (req,res)=>{
    res.send("shooppyness api working fine")
});

app.use(errorHandling);

app.listen(PORT,async()=>{
    console.log(`shoppyness api working http://localhost:${PORT}`);
   await connectToDatabse();
})

export default app
