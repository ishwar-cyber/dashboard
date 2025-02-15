import { Router } from "express";

const productRouter = Router();

productRouter.get('/',(req, res)=>{res.send({title:'GET all products'})});
productRouter.get('/:id',(req, res)=>{res.send({title:'GET products Details'})});
productRouter.post('/',(req, res)=>{res.send({title:'Create new product'})});
productRouter.put('/:id',(req, res)=>{res.send({title:'Update product'})});
productRouter.delete('/',(req, res)=>{res.send({title:' product deleted'})});


export default productRouter;