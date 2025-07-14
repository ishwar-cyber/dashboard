import Product from "../modules/product.modules.js"
import Category from "../modules/category.modules.js";
import Brand from "../modules/brand.modules.js";
import SubCategory from '../modules/sub_category.modules.js';
import mongoose from "mongoose";
import { uploadFile ,uploadFiles} from "../utilities/cloudnary.js";
export const createProduct = async(req, res, next)=>{
    try {
        const {name, model, price, stock, pincode, warranty, weight, height, width, length, offerPrice, subCategory, description, specifications, category, brand, status} = req.body;
        let {variants} = req.body; // Changed to let from const
        console.log('145', req.body);
        
        const file = req.files['productImages'];
        console.log('imahges', req.files);
        const multpleImages = file ? await uploadFiles(file) : null;
        console.log('product image', multpleImages);
        
        let thumbnail = null;
        
        if(multpleImages && multpleImages.length > 0) {
            thumbnail = multpleImages[0];
            
            // Parse variants if it's a string
            if (typeof variants === 'string') {
                variants = JSON.parse(variants || '[]');
            }
            
            // Handle variants if they exist
            console.log('files',variants);
            
            if(variants && variants.length > 0) {
                const variantImages = multpleImages.slice(1); // Skip first image (thumbnail)
                variants = variants.map((variant, index) => ({
                    ...variant,
                    variantImage: variantImages[index] || null
                }));
            }
        }

        const existingProduct = await Product.findOne({model});
        if(existingProduct){
            const error = new Error("Product Aleady added please increase Quntity");
            error.statusCode = 409;
            throw error;
        }        
        let saveProduct = new Product({name, price, pincode, warranty, variants, offerPrice, weight, height, width, length, subCategory, stock, description, specifications, model, category, brand, thumbnail, status});
        await saveProduct.save();
        // const response = await Product.find();
        res.status(200).json({
            success: true,
            message: "add new product",
            data: saveProduct
        })
    } catch (error) {
        next(error)
    }
}
export const getAllProducts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Searching (optional)
    const searchQuery = {};
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filtering by category (optional)
    if (req.query.category) {
      searchQuery.category = req.query.category;
    }

    const products = await Product.find(searchQuery).populate('category', 'name')
      .populate('brand', 'name')
      .populate('subCategory', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      success: true,
      count: products.length,
      page,
      totalPages,
      totalProducts,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
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

export const getProductByCategoryId = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Validate category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        
        
        // Find products where categories array contains this category ID
        const products = await Product.find({ category: categoryId }).lean();
       
        
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

export const updateProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const updates = req.body; // Assuming the product data is sent in the request body
        
        
        // Find existing product
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
                errorCode: "PRODUCT_NOT_FOUND"
            });
        }

        // Handle image update - Angular 18 will typically send files as FormData
        if (req.file) {
            // Check if the new image is different from existing
            const isNewImage = req.file.originalname !== existingProduct.thumbnail?.name;
            
            if (isNewImage) {
                try {
                    // Upload new image
                    const image = await uploadFile(req.file.path);
                    updates.thumbnail = {
                        url: image,
                        name: req.file.originalname,
                        size: req.file.size,
                        lastModified: Date.now()
                    };
                    
                    // Optionally: Delete old image from storage if needed
                    // await deleteFile(existingProduct.thumbnail.url);
                } catch (uploadError) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to upload new image",
                        errorCode: "IMAGE_UPLOAD_FAILED",
                        error: uploadError.message
                    });
                }
            }
        } else {
            // If no new image provided, maintain existing thumbnail data
            // Angular might send a flag if image was removed
            if (updates.removeThumbnail === 'true') {
                updates.thumbnail = null;
                // await deleteFile(existingProduct.thumbnail.url); // If you want to delete from storage
            } else {
                updates.thumbnail = existingProduct.thumbnail;
            }
        }

        // Clean up updates object (remove Angular-specific flags)
        delete updates.removeThumbnail;

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
            changes: Object.keys(updates) // Send back which fields were updated
        });

    } catch (error) {
        // Handle validation errors separately
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errorCode: "VALIDATION_ERROR",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
            error: error.message
        });
    }
};

export const uploadImages = async(req, res)=>{
    console.log('images product',req.body);
    
}