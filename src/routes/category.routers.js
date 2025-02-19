import express from "express";
import { create } from "../controllers/brand.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import authorize from "../middleware/auth.middlerwares.js";

const categoryRouter = express.Router();

categoryRouter.post('/', authorize, upload.single('categoryLogo'), create);

export default categoryRouter;