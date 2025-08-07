import { Router } from "express";
import { createProduct, search,getProductByCategoryId, getAllProducts, updateProductById, getProductById, deleteProduct, uploadImages } from "../controllers/product.controllers.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";

const productRouter = Router();

productRouter.get('/', getAllProducts);
productRouter.get('/search', search);
productRouter.get('/:id', getProductById);
productRouter.post('/', 
    tokenVerify, 
    role('admin'),
    upload.array(
    { name: 'variantImages', maxCount: 2 }),
    createProduct
);
productRouter.put('/:id', 
    tokenVerify, 
    role('admin'), 
    upload.any(),
    updateProductById
);
productRouter.delete('/:id', tokenVerify, role('admin'), deleteProduct);
productRouter.get('/category/:id', tokenVerify, getProductByCategoryId);
productRouter.post('/images',upload.fields([{ name: 'image', maxCount: 10 }]), uploadImages);

export default productRouter;

// upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'variants[0][variantImage]', maxCount: 1 }
// ]), 