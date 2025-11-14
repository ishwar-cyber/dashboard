import { Router } from "express";
import {tokenVerify, role} from "../middleware/auth.middlerwares.js";
import { getAllUser, getUser,updateAddress, addAddress, getUserAddresses } from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.get('/', tokenVerify, role('admin'), getAllUser);
userRouter.get('/:id', tokenVerify, getUser);
userRouter.get('/addresses/:id', tokenVerify, getUserAddresses);
userRouter.post('/',(req, res)=>{res.send({title:'Create new user'})});
userRouter.put('/update-user/:id', tokenVerify, updateAddress);
userRouter.post('/add-address/:id', tokenVerify, addAddress);
userRouter.delete('/',(req, res)=>{res.send({title:' user deleted'})});


export default userRouter;