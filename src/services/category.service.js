import errorHandling from '../middleware/error.middleware.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import slugify from 'slugify';

export const getAllCategories = async (options = {}) => {
    try {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;
        const query = options.query || {};
        if (options.isActive) {
            query.isActive = options.isActive === 'true';
        }
        if (options.search) {
            query.name = { $regex: options.search, $options: 'i' };
        }
        const categories = await Category.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await Category.countDocuments(query);
        // Add productCount for each category
        const categoriesWithProductCount = await Promise.all(categories.map(async (cat) => { 
            const productCount = await Product.countDocuments({ category: cat.id });    
            return { ...cat.toObject(), productCount };
        }));

        return {
            categories: categoriesWithProductCount,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
    }
};

export const createCategory = async (categoryData) => {
    try {
        if (!categoryData.slug) {
            categoryData.slug = slugify(categoryData.name, { lower: true });
        }
        const existingCategory = await Category.findOne({
            $or: [
                { name: categoryData.name },
                { slug: categoryData.slug }
            ]
        });
        if (existingCategory) {
            throw new Error("Category with this name or slug already exists", 400);
        }
        const category = new Category(categoryData);
        await category.save();
        return category;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Error creating category: ${error.message}`);
    }
};

export const getCategoryByIdOrSlug = async (idOrSlug) => {
    try {
        let category;
        const query = idOrSlug.includes('-') ? { slug: idOrSlug } : { _id: idOrSlug };
        if(/^[0-9a-fA-F]{24}$/.test(idOrSlug)){
            category = await Category.findById(idOrSlug);
        } else {
            category = await Category.findOne(query);
        }
        if (!category) {
            throw new Error('Category not found', 404);
        }
        return category;
    } catch (error) {
        throw new Error(`Error fetching category: ${error.message}`);
    }
};

export const updateCategoryById = async (id, categoryData) => {
    try {
        const category = await Category.findById(id);
        if (!category) {
            throw new Error('Category not found', 404);
        }
        Object.assign(category, categoryData);
        await category.save();
        return category;
    } catch (error) {
        throw new Error(`Error updating category: ${error.message}`);
    }
};

export const deleteCategory = async (id) => {
  try {
    const category = await Category.findById(id);
    if (!category) {
      throw new errorHandling('Category not found', 404);
    }
    // Check for products using this category
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      throw new errorHandling(
        `Cannot delete category with ${productsCount} associated products`,
        400
      );
    }
    
    // Check for child categories
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      throw new errorHandling(
        `Cannot delete category with ${childrenCount} child categories`,
        400
      );
    }

    await Category.findByIdAndDelete(id);
    return true;

  } catch (error) {
    if (error instanceof error) throw error;
    throw new Error(`Error deleting category: ${error.message}`);
  }
};

