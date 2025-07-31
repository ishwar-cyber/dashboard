import { uploadFile,deleteFile } from '../utilities/cloudnary.js';
import { createSubCategory, updateSubCategoryById,getSubCategoryByIdOrSlug,getSubCategoryByIdService, deleteSubCategory,getAllSubCategories } from '../services/subCategory.service.js';

export const create = async (req, res) => {
    try {
        const subCategoryData = {...req.body};
        if (req.file) {
            const result = await uploadFile(req.file.path);
            subCategoryData.image = {
                url: result.url,
                public_id: result.public_id
            }
        }
        if (!subCategoryData.category) {
            const error = new Error('Category is required');
            error.statusCode = 400;
            throw error;
        }
        res.status(200).json({
            success: true,
            message: "SubCategory added successfully",
            data: await createSubCategory(subCategoryData)
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getSubCategories = async (req, res) => {
    try {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            query: req.query.query,
            isActive: req.query.isActive,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const subCategories = await getAllSubCategories(options);
        res.status(200).json({
            success: true,
            message: "SubCategories fetched successfully",
            data: subCategories?.subCategories,
            pagination: subCategories?.pagination
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}
export const getSubCategoryById = async (req, res) => {
    try {
        let subCategory = await getSubCategoryByIdService(req.params.id);
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
        let subCategory = {...req.body}
        let id = req.params.id;

        const existingSubCategory = await getSubCategoryByIdOrSlug(id);
        if (req.file && !existingSubCategory.image.public_id) {
            const result = await uploadFile(req.file.path);
            subCategory.image = {
                url: result.url,
                public_id: result.public_id
            };
        } else {
            subCategory.image = existingSubCategory.image;
        }

        if(req.file && !existingSubCategory.image.public_id){
            const result = await uploadFile(req.file.path);
            subCategory.image = {
                url: result.url,
                public_id: result.public_id
            };
        } else {
            subCategory.image = existingSubCategory.image;
        }
        res.status(200).json({
            success: true,
            message: 'SubCategory updated successfully',
            data:  await updateSubCategoryById(id, subCategory)
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
        let subCategory = await getSubCategoryByIdOrSlug(req.params.id);
        let deleteSub = await deleteSubCategory(req.params.id);
        
        if(subCategory.image && subCategory.image.public_id) {
            // Assuming deleteFile is a function that deletes the file from cloud storage
            await deleteFile(subCategory.image.public_id);
        }   
        res.status(200).json({
            success: true,
            message: 'SubCategory is deleted',
            data: {}
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}
