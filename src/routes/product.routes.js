import { Router } from "express";
import { createProduct, search, getAllProducts, getProductById, deleteProduct } from "../controllers/product.controllers.js";
import authorize from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";
const productRouter = Router();

productRouter.get('/', authorize, getAllProducts);
productRouter.get('/search', search);
productRouter.get('/:id', getProductById);
productRouter.post('/',authorize, upload.single('image'), createProduct);
productRouter.put('/:id',(req, res)=>{res.send({title:'Update product'})});
productRouter.delete('/:id',authorize, deleteProduct);


export default productRouter;