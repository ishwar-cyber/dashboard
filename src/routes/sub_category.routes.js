import express from 'express';
import { create, deleteById, getSubCategoryById, updateSubCategory, getSubCategories } from '../controllers/sub_category.controllers.js';
import { upload } from '../middleware/multer.middlerwares.js';
import { authenticate, roleBase } from '../middleware/auth.middlerwares.js';

const subCategoryRouter = express.Router();

subCategoryRouter.post('/', authenticate, roleBase('admin'), upload.single('image'), create);
subCategoryRouter.get('/', getSubCategories);
subCategoryRouter.delete('/:id', authenticate, roleBase('admin'), deleteById);
subCategoryRouter.get('/:id', authenticate, roleBase('admin'), getSubCategoryById);
subCategoryRouter.put('/:id', authenticate, roleBase('admin'), upload.single('image'), updateSubCategory)

export default subCategoryRouter;