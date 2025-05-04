import express from "express";
import { create, deleteById,updateCategory, getCategories } from "../controllers/category.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { authorize, roleBase } from "../middleware/auth.middlerwares.js";

const categoryRouter = express.Router();

categoryRouter.post('/', authorize,roleBase('admin'), upload.single('image'), create);
categoryRouter.get('/', getCategories);
categoryRouter.delete('/:id', authorize, roleBase('admin'), deleteById);
categoryRouter.put('/:id', authorize, roleBase('admin'), upload.single('image'), updateCategory);
categoryRouter.get('/:id', authorize, roleBase('admin'), getCategories);
export default categoryRouter;