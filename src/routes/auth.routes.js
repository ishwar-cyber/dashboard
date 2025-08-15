import { Router } from "express";
import { signUp, signIn, userSignIn } from "../controllers/auth.controllers.js";
const authRouter = Router();

authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-in/user', userSignIn);
authRouter.post('/sign-out',(req, res)=>{res.send({title:'Sign out'})})

export default authRouter;