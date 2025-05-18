import { Router } from "express";
import { addPincode, getPincode } from "../controllers/service_pincode.controller.js"
import { authorize, roleBase } from "../middleware/auth.middlerwares.js";
const pincodeRouter = Router();

pincodeRouter.post('/', authorize, roleBase('admin'), addPincode);
pincodeRouter.get('/', authorize, roleBase('admin'), getPincode)
export default pincodeRouter;