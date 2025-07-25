import express from "express";
import { create, deleteById,updateCategory, getCategories } from "../controllers/category.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";

const categoryRouter = express.Router();
categoryRouter.get('/', getCategories);
categoryRouter.get('/:id', getCategories);

categoryRouter.use(tokenVerify, role('admin'));
categoryRouter.post('/', upload.single('image'), create);
categoryRouter.delete('/:id', deleteById);
categoryRouter.put('/:id', upload.single('image'), updateCategory);
export default categoryRouter;