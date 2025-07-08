import Brand from "../modules/brand.modules.js";
import { uploadFile } from "../utilities/cloudnary.js";

export const create = async (req, res) => {
    try {
        const { name, status, description } = req.body;
        const file = req.file; // Access the uploaded file from Multer
        const image = file ? await uploadFile(file.path) : null; // Upload to Cloudinary if file exists
        let existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            const error = new Error("Brand is already created");
            error.statusCode = 409;
            throw error;
        }

        let brand = new Brand({ name, image, status, description });
        await brand.save();
        res.status(200).json({
            success: true,
            message: 'Brand is created',
            data: brand
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

export const getBrand = async (req, res) => {
    try {
        let brands = await Brand.find();
        res.status(200).json({
            success: true,
            data: brands
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getBrandById = async (req, res) => {
    try {
        let brand = await Brand.findById(req.params.id);
        if (!brand) {
            const error = new Error('Brand not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}

export const updateBrand = async (req, res) => {
    try {
        const { name, isPublic } = req.body;
        const file = req.file; // Access the uploaded file from Multer
        const uploadedImage = file ? await uploadFile(file.path) : null; // Upload to Cloudinary if file exists

        let brand = await Brand.findById(req.params.id);
        if (!brand) {
            const error = new Error('Brand not found');
            error.statusCode = 404;
            throw error;
        }

        brand.name = name;
        brand.isPublic = isPublic;
        if (uploadedImage) {
            brand.image = uploadedImage;
        }
        await brand.save();
        res.status(200).json({
            success: true,
            message: 'Brand is updated',
            data: {
                name: brand.name,
                id: brand.id,
                image: brand.image, 
                isPublic: brand.isPublic
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}

export const deleteBrand = async (req, res) => {
    try {
        const id = req.params.id;
        let brand = await Brand.findByIdAndDelete(id);
        if (!brand) {
            const error = new Error('Brand not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            message: 'Brand is deleted'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}


