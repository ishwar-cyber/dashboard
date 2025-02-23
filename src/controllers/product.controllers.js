import Product from "../modules/product.modules.js"
import { uploadFile } from "../utilities/cloudnary.js";
export const createProduct = async(req, res, next)=>{
    try {
        const {name,price,model,description,category,brand,image} = req.body;
        if(!req.file){
            const error = new Error("Please upload a file");
            error.statusCode = 400;
            throw error;
        }
        const file = req.file.filename;
        console.log('file name', file);
        let uploadedImage = await uploadFile(file);
        // console.log('image users uploaded', uploadedImage);
        
        const existingProduct = await Product.findOne({model});

        if(existingProduct){
            const error = new Error("Product Aleady added please increase Quntity");
            error.statusCode = 409;
            throw error;
        }
    
                    
        let saveProduct = new Product({name, price,description,model,category,brand,image});
        await saveProduct.save();
        res.status(200).json({
            success: true,
            message: "add new product",
            data: saveProduct
        })
    } catch (error) {
        next(error)
    }
}

export const getAllProducts = async(req,res)=>{
    try {
        let products = await Product.find();
        res.status(200).json({
            success: true,
            data: products
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};

export const search = async(req,res)=>{
    try {
        let query={}

        if(req.query.keyword){
            query.$or = [
                {name:{$regex: req.query.keyword, $options:'i'}},
                {description:{$regex: req.query.keyword, $options:'i'}},
                {brand:{$regex: req.query.keyword, $options:'i'}},
            ]
        }
        if(req.query.category){
            query.category = req.query.cateogry
        }

        if(req.query.min && req.query.max){
            query.price = {$gte: parseFloat(req.query.min), $lte: parseFloat(req.query.max)}
        }

        let searchProduct = await Product.find(query);
        res.status(200).json({
            success: true,
            data: searchProduct
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getProductById = async(req,res)=>{
    try {
        let product = await Product.findById(req.params.id);
        res.status(200).json({
            success: true,
            data: product
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const deleteProduct = async(req, res)=>{
    try {
        let id = req.params.id;
        let productDetails = await Product.findByIdAndDelete(id);
        res.status(200).json({
            status: "deleted product successfully",
            data: productDetails
        }) 
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}