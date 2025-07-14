import express from "express";
import { create, deleteById,updateCategory, getCategories } from "../controllers/category.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { authenticate, roleBase } from "../middleware/auth.middlerwares.js";

const categoryRouter = express.Router();

categoryRouter.post('/', authenticate,roleBase('admin'), upload.single('image'), create);
categoryRouter.get('/', getCategories);
categoryRouter.delete('/:id', authenticate, roleBase('admin'), deleteById);
categoryRouter.put('/:id', authenticate, roleBase('admin'), upload.single('image'), updateCategory);
categoryRouter.get('/:id', authenticate, roleBase('admin'), getCategories);
export default categoryRouter;