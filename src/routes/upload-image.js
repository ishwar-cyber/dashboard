import {Router} from "express";
import {uploadImages} from "../controllers/upload-image.controller.js";
import { upload } from "../middleware/multer.middlerwares.js";

const uploadImageRouter = Router();

uploadImageRouter.post(
  '/images',
  upload.fields([{ name: 'image', maxCount: 10 }]),
  uploadImages
);

export default uploadImageRouter;