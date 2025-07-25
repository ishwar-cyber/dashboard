import express from "express";
import { create, getBrands, deleteBrand } from "../controllers/brand.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";


const brandRouter = express.Router();
brandRouter.get('/', getBrands);

brandRouter.use(tokenVerify);

brandRouter.post('/', role('admin'), upload.single('image'), create);
brandRouter.delete('/:id',  role('admin'), deleteBrand);

export default brandRouter;