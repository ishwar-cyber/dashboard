import express from "express";
import { create, getBrand } from "../controllers/brand.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import authorize from "../middleware/auth.middlerwares.js";


const brandRouter = express.Router();

brandRouter.post('/', authorize, upload.single('brandLogo'), create);
brandRouter.get('/', authorize, getBrand);


export default brandRouter;