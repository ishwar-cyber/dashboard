import { Router } from "express";
import { createProduct, search } from "../controllers/product.controllers.js";
import authorize from "../middleware/auth.middlerwares.js";
import { upload } from "../middleware/multer.middlerwares.js";
const productRouter = Router();

productRouter.get('/',(req, res)=>{res.send({title:'GET all products'})});
productRouter.get('/search', search);
productRouter.get('/:id',(req, res)=>{res.send({title:'GET products Details'})});
productRouter.post('/',authorize, createProduct);
productRouter.put('/:id',(req, res)=>{res.send({title:'Update product'})});
productRouter.delete('/',(req, res)=>{res.send({title:' product deleted'})});


export default productRouter;