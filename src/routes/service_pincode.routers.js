import { Router } from "express";
import { addPincode, getPincode, deletePincode } from "../controllers/service_pincode.controller.js"
import { authenticate, roleBase } from "../middleware/auth.middlerwares.js";
const pincodeRouter = Router();

pincodeRouter.post('/', authenticate, roleBase('admin'), addPincode);
pincodeRouter.get('/', authenticate, roleBase('admin'), getPincode);
pincodeRouter.delete('/:id',authenticate, roleBase('admin'), deletePincode);
export default pincodeRouter;