import { Router } from "express";
import { signUp, signIn, userSignIn, mergeCartAfterLogin } from "../controllers/auth.controllers.js";
const authRouter = Router();

authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-in/user', userSignIn);
authRouter.post('/marge-cart', mergeCartAfterLogin)
authRouter.post('/sign-out',(req, res)=>{res.send({title:'Sign out'})})

export default authRouter;