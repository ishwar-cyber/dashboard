import Category from "../modules/category.modules.js";
import { createCategory, getCategoryByIdOrSlug, updateCategoryById } from "../services/category.service.js";
import { uploadFile, deleteFile } from "../utilities/cloudnary.js";
export const create = async (req, res) => {
    try {
        const categoryData = {...req.body};
        if(req.file){
            const result = await uploadFile(req.file.path);
            categoryData.image = {
                url: result.url,
                public_id: result.public_id
            }
        }

        
        res.status(200).json({
            success: true,
            message: "Category added successfully",
            data: await createCategory(categoryData)
        });

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};

export const getCategories = async (req, res) => {
    try {
        let categories = await Category.find().populate('_id');
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getCategoryById = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

export const updateCategory = async (req, res) => {
    try {
        let category = {...req.body}
        let id = req.params.id;

        const existingCategory = await getCategoryByIdOrSlug(id);
        console.log('existingCategory', existingCategory);
    

        if(req.file && !existingCategory.image.public_id){
            const result = await uploadFile(req.file.path);
            category.image = {
                url: result.url,
                public_id: result.public_id
            };
        } else {
            category.image = existingCategory.image;
        }
        const categoryUpdated = await updateCategoryById(id, category);
        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: categoryUpdated
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteById = async (req, res) => {
    try {

        let category = await Category.findById(req.params.id);
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
        await category.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Category is deleted'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}