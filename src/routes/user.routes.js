import { Router } from "express";
import {tokenVerify, role} from "../middleware/auth.middlerwares.js";
import { getAllUser, getUser } from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.get('/', tokenVerify, role('admin'), getAllUser);
userRouter.get('/:id', tokenVerify, getUser);
userRouter.post('/',(req, res)=>{res.send({title:'Create new user'})});
userRouter.put('/:id',(req, res)=>{res.send({title:'Update user'})});
userRouter.delete('/',(req, res)=>{res.send({title:' user deleted'})});


export default userRouter;