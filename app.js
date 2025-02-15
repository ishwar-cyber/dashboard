import express from "express";
// import {PORT}  from "./config/env.js";
import cookieParser from "cookie-parser";
import{PORT} from "./config/env.js"

import userRouter from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import productRouter from "./src/routes/createProduct.routes.js";
import connectToDatabse from "./src/database/mongodb.js";
import errorHandling from "./src/middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);

app.use(errorHandling);

app.get('/', (req,res)=>{
    res.send("shooppyness api working fine")
});

app.listen(PORT,async()=>{
    console.log(`shoppyness api working http://localhost:${PORT}`);
   await connectToDatabse();
})

export default app
