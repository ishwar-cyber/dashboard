
import SubCategory from '../modules/sub_category.modules.js';
import Category from "../modules/category.modules.js";
import { uploadFile } from '../utilities/cloudnary.js';

export const create = async (req, res) => {
    try {
        const { name, status, category } = req.body;
        const file = req.file; // Access the uploaded file from Multer
        const image = file ? await uploadFile(file.path) : null; // Upload to Cloudinary if file exists
        
      
        const existingSubCategory = await SubCategory.findOne({name});
        if (existingSubCategory) {
            const error = new Error("SubCategory already exists");
            error.statusCode = 409;
            throw error;
        }
        let subCategory = new SubCategory({name, image, status, category});
        await subCategory.save();
        res.status(200).json({
            success: true,
            message: "SubCategory added successfully",
            data: subCategory
        });

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getSubCategories = async (req, res) => {
    try {
        let subCategories = await SubCategory.find().populate('category', 'name');
        res.status(200).json({
            success: true,
            message: "SubCategories fetched successfully",
            data: subCategories
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getSubCategoryById = async (req, res) => {
    try {
        let subCategory = await SubCategory.findById(req.params.id).populate('category');
        if (!subCategory) {
            const error = new Error('SubCategory not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: subCategory
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

export const updateSubCategory = async (req, res) => {
    try {
        const { name, status, category } = req.body;
        const file = req.file; // Access the uploaded file from Multer
        const image = file ? await uploadFile(file.path) : null; // Upload to Cloudinary if file exists
       
        let subCategory = await SubCategory.findById(req.params.id);
        if (!subCategory) {
            const error = new Error('SubCategory not found');
            error.statusCode = 404;
            throw error;
        }
        subCategory.name = name || subCategory.name;
        subCategory.image = image || subCategory.image;
        subCategory.status = status || subCategory.status;
        subCategory.category = category || subCategory.category;
        
        await subCategory.save();
        res.status(200).json({
            success: true,
            message: "SubCategory updated successfully",
            data: subCategory
        });

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const deleteById = async (req, res) => {
    try {
        let subCategory = await SubCategory.findById(req.params.id);
        if (!subCategory) {
            const error = new Error('SubCategory not found');
            error.statusCode = 404;
            throw error;
        }
        await subCategory.remove();
        res.status(200).json({
            success: true,
            message: "SubCategory deleted successfully",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}
