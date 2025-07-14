import express from "express";
import { create, getBrand } from "../controllers/brand.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { authenticate, roleBase } from "../middleware/auth.middlerwares.js";


const brandRouter = express.Router();

brandRouter.post('/', authenticate, roleBase('admin'), upload.single('image'), create);
brandRouter.get('/', getBrand);


export default brandRouter;