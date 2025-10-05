import { Router } from "express";
import { 
  createProduct, 
  searchProduct,
  getProductByCategoryId, 
  getAllProducts, 
  updateProductById, 
  getProductById, 
  deleteProduct, 
  uploadImages ,
  findRelatedProducts,
  filterProducts
} from "../controllers/product.controllers.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";

const productRouter = Router();

// Public Routes
productRouter.get('/', getAllProducts);
productRouter.get('/search', searchProduct);
productRouter.get('/:slug/related', findRelatedProducts);
productRouter.get('/category/:slug', getProductByCategoryId);
productRouter.get('/filter', filterProducts);
productRouter.get('/:slug', getProductById);

// Admin Routes
productRouter.post('/', 
  tokenVerify, 
  role('admin'),
  upload.array('variantImages', 2),
  createProduct
);

productRouter.put('/:id', 
  tokenVerify, 
  role('admin'),
  updateProductById
);
productRouter.patch('/:id', 
  tokenVerify, 
  role('admin'),
  upload.array('variantImages', 2),
  updateProductById
);

productRouter.delete('/:id', tokenVerify, role('admin'), deleteProduct);

productRouter.post(
  '/images',
  upload.fields([{ name: 'image', maxCount: 10 }]),
  uploadImages
);

export default productRouter;
