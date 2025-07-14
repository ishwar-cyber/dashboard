import { Router } from "express";
import { addPincode, getPincode } from "../controllers/service_pincode.controller.js"
import { authenticate, roleBase } from "../middleware/auth.middlerwares.js";
const pincodeRouter = Router();

pincodeRouter.post('/', authenticate, roleBase('admin'), addPincode);
pincodeRouter.get('/', authenticate, roleBase('admin'), getPincode)
export default pincodeRouter;