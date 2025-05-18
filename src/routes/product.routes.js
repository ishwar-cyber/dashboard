import { Router } from "express";
import { createProduct, search,getProductByCategoryId, getAllProducts, updateProductById, getProductById, deleteProduct } from "../controllers/product.controllers.js";
import {authorize, roleBase} from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";

const productRouter = Router();

productRouter.get('/', getAllProducts);
productRouter.get('/search', search);
productRouter.get('/:id', getProductById);
productRouter.post('/', 
    authorize, 
    roleBase('admin'), 
    upload.any(),
    createProduct
);
productRouter.put('/:id', 
    authorize, 
    roleBase('admin'), 
    upload.any(),
    updateProductById
);
productRouter.delete('/:id',authorize, roleBase('admin'), deleteProduct);
productRouter.get('/category/:id', getProductByCategoryId);
export default productRouter;

// upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'variants[0][variantImage]', maxCount: 1 }
// ]), 