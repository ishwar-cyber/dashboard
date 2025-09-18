import Product from "../models/product.models.js";
import Category from "../models/category.models.js"; 
import Brand from "../models/brand.models.js";
import SubCategory from "../models/sub_category.models.js";
import Inventory from '../models/inventory.models.js';
import slugify from "slugify";

export const getProducts = async (options = {}) => {
    try {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;

        const query = options.query || {};
        if (options.isActive) {
            query.isActive = options.isActive === 'true';
        }

        if(options.featured) {
            query.featured = options.featured === 'true';
        }
        if (options.category) {
            query.$or = query.$or || [];
            query.$or.push({ category: { $in: options.category } });
        }
        if (options.brand) {
            query.brand =  options.brand;
        }
        if (options.subCategory) {
            query.subCategory = options.subCategory;
        }

        if (options.minPrice !== undefined && options.maxPrice !== undefined) {
            query.price = {};
            if(options.minPrice !== undefined) {
                query.price.$gte = parseFloat(options.minPrice);
            }
            if(options.maxPrice !== undefined) {
                query.price.$lte = parseFloat(options.maxPrice);
            }
        }
         if (options.search) {
            query.$or = [
               { name: { $regex: options.search, $options: 'i' }},
               {description: { $regex: options.search, $options: 'i' }},
               {brand: { $regex: options.search, $options: 'i' }}
            ];
        }
        const sortField = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
        const sort = { [sortField]: sortOrder };
        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate('category', 'name slug image')
            .populate('brand', 'name slug image')
            .populate('subCategory', 'name slug image').lean();

        const productId = products.map(product => product);
        const inventories = await Inventory.find({ product: { $in: productId } });
        const productsWithInventory = products.map(product => {
            const inventory = inventories.find(inv => inv.product.toString() === product._id.toString());
            return {
                ...product,
                inventory: inventory ? inventory.toObject() : {inStock: false, quantity: 0,reserved: 0, available: 0}
            };
        });
        const total = await Product.countDocuments(query);

        return {
            products: productsWithInventory,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching products: ${error.message}`);
    }
};
export const create = async (productData) => {
    try {
        // 1. Generate slug if not provided
        if (!productData.slug) {
            productData.slug = slugify(productData.name, { lower: true });
        }

        // 2. Check for duplicate product name or slug
        const existingProduct = await Product.findOne({
            $or: [
                { name: productData.name },
                { slug: productData.slug },
                { sku: productData.sku }
            ]
        });

        if (existingProduct) {
            throw new Error("Product with this name or slug already exists");
        }

        // 3. Lookup and attach category ObjectId
        if (!productData.category && productData.categoryName) {
            const category = await Category.findOne({ name: productData.categoryName });
            if (!category) {
                throw new Error("Category not found");
            }
            productData.category = category._id;
        }

        // 4. Lookup and attach brand ObjectId
        if (!productData.brand && productData.brandName) {
            const brand = await Brand.findOne({ name: productData.brandName });
            if (!brand) {
                throw new Error("Brand not found");
            }
            productData.brand = brand._id;
        }

        // 5. Lookup and attach subCategory ObjectId
        if (!productData.subCategory && productData.subCategoryName) {
            const subCategory = await SubCategory.findOne({ name: productData.subCategoryName });
            if (!subCategory) {
                throw new Error("SubCategory not found");
            }
            productData.subCategory = subCategory._id;
        }
        // 6. Transform image data if it's split into urls + ids
        if (Array.isArray(productData.images.url) && Array.isArray(productData.images.public_id)) {
            productData.images = productData.images.url.map((url, index) => ({
                url,
                public_id: productData.images.public_id[index]
            }));
        }

        // 7. Ensure images is an array of { url, public_id }
        if (!Array.isArray(productData.images)) {
            productData.images = [];
        }

        // 8. Create product
        const product = await Product.create(productData);
        return product;
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
};
