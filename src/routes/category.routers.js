import express from "express";
import { create } from "../controllers/category.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { authorize, roleBase } from "../middleware/auth.middlerwares.js";

const categoryRouter = express.Router();

categoryRouter.post('/', authorize,roleBase('admin'), upload.single('categoryLogo'), create);

export default categoryRouter;