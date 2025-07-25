import Brand from "../modules/brand.modules.js";
import { uploadFile, deleteFile } from "../utilities/cloudnary.js";
import {createBrand, getAllBrands, getBrandById, deleteBrandById} from "../services/brand.service.js"
export const create = async (req, res, next) => {
    try {
        let brandData  = {...req.body};
        if(req.file){
            const result = await uploadFile(req.file.path);
            console.log('brand image', result);
            
            brandData.image = {
                url: result.url,
                public_id: result.public_id
            }
        }
        let brand =  await createBrand(brandData);
        res.status(200).json({
            success: true,
            message: 'Brand is created',
            brand
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

export const getBrands = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            featured: req.query.featured,
            active: req.query.active,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        let brands = await getAllBrands(options);
        res.status(200).json({
            success: true,
            data: brands
        });
    } catch (error) {
       next(error);
    }
}

export const getBrand = async (req, res) => {
    try {
        let brand = await getBrandById(req.params.id);
       
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (error) {
       next(error)
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
        let brand = await getBrandById(id);
        if (brand.image && brand.image.public_id) {
            await deleteFile(brand.image.public_id);
        }
        await deleteBrandById(id);
        res.status(200).json({
            success: true,
            data: {},
            message: 'Brand is deleted'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}


