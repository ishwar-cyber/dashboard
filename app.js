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
import orderRouter from "./src/routes/order.routers.js";
import orderItemsRouter from "./src/routes/order_items.routers.js";
import couponRouter from "./src/routes/coupon.routers.js";
import subCategoryRouter from "./src/routes/sub_category.routes.js";

const app = express();

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: false,limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());
app.use(cors())

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/brands', brandRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/cart', orderItemsRouter);
app.use('/api/v1/coupon', couponRouter);
app.use('/api/v1/subcategory', subCategoryRouter);



app.use(errorHandling);

app.get('/', (req,res)=>{
    res.send("shooppyness api working fine")
});

app.listen(PORT,async()=>{
    console.log(`shoppyness api working http://localhost:${PORT}`);
   await connectToDatabse();
})

export default app
