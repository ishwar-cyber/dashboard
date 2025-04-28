import { Router } from "express";
import { createProduct, search, getAllProducts, getProductById, deleteProduct } from "../controllers/product.controllers.js";
import {authorize, roleBase} from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";

const productRouter = Router();

productRouter.get('/', getAllProducts);
productRouter.get('/search', search);
productRouter.get('/:id', getProductById);
productRouter.post('/',authorize, roleBase('admin'), upload.single('thumbnail'), createProduct);
productRouter.put('/:id',(req, res)=>{res.send({title:'Update product'})});
productRouter.delete('/:id',authorize, roleBase('admin'), deleteProduct);


export default productRouter;