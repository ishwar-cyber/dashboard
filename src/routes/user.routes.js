import { Router } from "express";
import {authenticate, roleBase} from "../middleware/auth.middlerwares.js";
import { getUser } from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.get('/',(req, res)=>{res.send({title:'GET all users'})});
userRouter.get('/:id', authenticate, getUser);
userRouter.post('/',(req, res)=>{res.send({title:'Create new user'})});
userRouter.put('/:id',(req, res)=>{res.send({title:'Update user'})});
userRouter.delete('/',(req, res)=>{res.send({title:' user deleted'})});


export default userRouter;