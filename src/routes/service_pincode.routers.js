import { Router } from "express";
import { addPincode, getPincode, deletePincode } from "../controllers/service_pincode.controller.js"
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
const pincodeRouter = Router();

pincodeRouter.post('/', tokenVerify, role('admin'), addPincode);
pincodeRouter.get('/', tokenVerify, role('admin'), getPincode);
pincodeRouter.delete('/:id', tokenVerify, role('admin'), deletePincode);
export default pincodeRouter;