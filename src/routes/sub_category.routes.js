import express from 'express';
import { create, deleteById, getSubCategoryById, updateSubCategory, getSubCategories, getSubCategoriesByCategories } from '../controllers/sub_category.controllers.js';
import { upload } from '../middleware/multer.middlerwares.js';
import { tokenVerify, role } from '../middleware/auth.middlerwares.js';

const subCategoryRouter = express.Router();
subCategoryRouter.get('/', getSubCategories);
subCategoryRouter.get('/:id', getSubCategoryById);
subCategoryRouter.get('/by-category/:id', getSubCategoriesByCategories)
subCategoryRouter.use(tokenVerify, role('admin'));

subCategoryRouter.post('/', upload.single('image'), create);
subCategoryRouter.delete('/:id', deleteById);
subCategoryRouter.put('/:id', upload.single('image'), updateSubCategory);

export default subCategoryRouter;