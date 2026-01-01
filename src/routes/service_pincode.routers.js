import { Router } from "express";
import { addPincode, getPincode, deletePincode } from "../controllers/service_pincode.controller.js"
import { postAvailableCouriers } from "../controllers/shipping.controller.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
const pincodeRouter = Router();

pincodeRouter.post('/', tokenVerify, role('admin'), addPincode);
pincodeRouter.get('/', tokenVerify, role('admin'), getPincode);
pincodeRouter.post('/couriers', postAvailableCouriers);
pincodeRouter.delete('/:id', tokenVerify, role('admin'), deletePincode);
export default pincodeRouter;