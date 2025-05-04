import express from 'express';
import { create, deleteById, getSubCategoryById, updateSubCategory, getSubCategories } from '../controllers/sub_category.controllers.js';
import { upload } from '../middleware/multer.middlerwares.js';
import { authorize, roleBase } from '../middleware/auth.middlerwares.js';

const subCategoryRouter = express.Router();

subCategoryRouter.post('/', authorize, roleBase('admin'), upload.single('image'), create);
subCategoryRouter.get('/', getSubCategories);
subCategoryRouter.delete('/:id', authorize, roleBase('admin'), deleteById);
subCategoryRouter.get('/:id', authorize, roleBase('admin'), getSubCategoryById);
subCategoryRouter.put('/:id', authorize, roleBase('admin'), upload.single('image'), updateSubCategory)

export default subCategoryRouter;