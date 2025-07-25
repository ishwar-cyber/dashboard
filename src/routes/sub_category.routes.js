import express from 'express';
import { create, deleteById, getSubCategoryById, updateSubCategory, getSubCategories } from '../controllers/sub_category.controllers.js';
import { upload } from '../middleware/multer.middlerwares.js';
import { tokenVerify, role } from '../middleware/auth.middlerwares.js';

const subCategoryRouter = express.Router();

subCategoryRouter.post('/', tokenVerify, role('admin'), upload.single('image'), create);
subCategoryRouter.get('/', getSubCategories);
subCategoryRouter.delete('/:id', tokenVerify, role('admin'), deleteById);
subCategoryRouter.get('/:id', tokenVerify, role('admin'), getSubCategoryById);
subCategoryRouter.put('/:id', tokenVerify, role('admin'), upload.single('image'), updateSubCategory)

export default subCategoryRouter;