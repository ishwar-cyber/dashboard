import { Router } from "express";
import { createProduct, search,getProductByCategoryId, getAllProducts, updateProductById, getProductById, deleteProduct, uploadImages } from "../controllers/product.controllers.js";
import { authenticate, roleBase } from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";

const productRouter = Router();

productRouter.get('/', getAllProducts);
productRouter.get('/search', search);
productRouter.get('/:id', getProductById);
productRouter.post('/', 
    authenticate, 
    roleBase('admin'),
    upload.fields([{ name: 'productImages', maxCount: 10 },
    { name: 'variantImages', maxCount: 10 } ]),
    createProduct
);
productRouter.put('/:id', 
    authenticate, 
    roleBase('admin'), 
    upload.any(),
    updateProductById
);
productRouter.delete('/:id',authenticate, roleBase('admin'), deleteProduct);
productRouter.get('/category/:id', getProductByCategoryId);
productRouter.post('/images',upload.fields([{ name: 'productImages', maxCount: 10 }]), uploadImages)
export default productRouter;

// upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'variants[0][variantImage]', maxCount: 1 }
// ]), 