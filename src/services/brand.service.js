import mongoose from "mongoose";
import Brand from "../modules/brand.modules.js";
import slugify from "slugify";

export const createBrand = async(brandData) => {
    try {
        if(!brandData.slug){
            brandData.slug = slugify(brandData.name,{lower: true});
        }
        const existingBrand = await Brand.findOne({
            $or:[
                {name: brandData.name},
                {slug: brandData.slug}
            ]
        });
        if(existingBrand){
            throw new Error("Brand with thid name or slug already exists", 400);
        }
        const brand = new Brand(brandData);
        await brand.save();
        return brand;
    } catch (error) {
        if(error instanceof Error){
            throw error;
        }
        throw new Error(`Error creating brand:${error.message}`);
    }
};
export const getAllBrands = async(options = {}) => {
    try {
        const page = parseInt(options.page, 10) || 1;
        const limit = parseInt(options.limit, 10) || 10;
        const skip = (page-1) * limit;

        const query = {};

        if(options.search){
            query.name = {$regex: options.search, $options: 'i'};
        }
        if(options.featured !== undefined){
            query.featured = options.featured === 'true';
        }
        if(options.active !== undefined){
            query.active = options.active === 'true';
        }

        const sortBy = options.sortBy || 'name';
        const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
        const sort = {[sortBy]: sortOrder};

        const brands = await Brand.find(query).sort(sort).skip(skip).limit(limit);
        const total = await Brand.countDocuments(query);

        return {
            data: brands,
            pagination:{
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        throw new Error(`Error fetching brands: ${error.message}`);
    }
};
export const getBrandById = async(id) => {
    try {
        const brand = await Brand.findById(id);
        if(!brand){
            throw new Error(`Brand not found`, 400);
        }
        return brand;
    } catch (error) {
        if(error instanceof error){
            throw error;
        }
        throw new Error(`Error fetching brand: ${error.message}`); 
    }
};
export const deleteBrandById = async(id) => {
    try {
        const productCount = await mongoose.model('Product').countDocuments({brand: id});
        if(productCount > 0){
            throw new Error(`Cannot delete brand with ${productCount} associated product`, 400);
        } 
        const brand = await Brand.findByIdAndDelete(id);
        if(!brand){
            throw new Error(`Brand not found`, 400);
        }
        return { success: true};
    } catch (error) {
        throw new Error(`Error deleting brand: ${error.message}`); 
    }
};