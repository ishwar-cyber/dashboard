import { Router } from "express";
import {
  create,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  relatedProducts,
  getProductsByCategory,
  getProductsBySubCategory
} from "../controllers/product.controllers.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { updateProductSchema } from "../zod-validater/product.validation.js";
import { validations } from "../utilities/validation.js";
const productRouter = Router();

// Public Routes
productRouter.get('/', getProducts);
productRouter.get('/search', searchProduct);
productRouter.get('/:slug/related', relatedProducts);
productRouter.get('/category/:slug', getProductsByCategory);
productRouter.get('/:slug', getProduct);
productRouter.get('/category/:catSlug/:subSlug', getProductsBySubCategory);

// Admin Routes
productRouter.post('/', 
  tokenVerify, 
  role('admin'),
  upload.array('variantImages', 2),
  create
);

productRouter.put('/:id', 
  tokenVerify, 
  role('admin'),
  validations(updateProductSchema), // ✅ validate first
  updateProduct
);
productRouter.patch('/:id', 
  tokenVerify, 
  role('admin'),
    validations(updateProductSchema), // ✅ validate first
  upload.array('variantImages', 2),
  updateProduct
);

productRouter.delete('/:id', tokenVerify, role('admin'), deleteProduct);

export default productRouter;
