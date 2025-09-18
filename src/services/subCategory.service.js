import SubCategory from '../models/sub_category.model.js';
import Product from '../models/product.model.js';
import slugify from 'slugify';

export const getAllSubCategories = async (options = {}) => {
    try {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;
        // If you want to implement pagination, you can use the skip and limit options
        const query = options.query || {};
        if(options.isActive) {
            query.isActive = options.isActive === 'true';
        }
        if(options.search) {
            query.name = { $regex: options.search, $options: 'i' };
        }   
        const subCategories = await SubCategory.find(query)
            .skip(skip)
            .limit(limit)
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        const total = await SubCategory.countDocuments(query);
        // Add productCount for each subcategory
        const subCategoriesWithProductCount = await Promise.all(subCategories.map(async (subCat) => {
            const productCount = await Product.countDocuments({ subCategory: subCat._id });
            return { ...subCat.toObject(), productCount };
        }));
        return {
            subCategories: subCategoriesWithProductCount,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching subCategories: ${error.message}`);
    }
};

export const getSubCategoryByIdService = async (id) => {
    try {
        const subCategory = await SubCategory.findById(id).populate('category', 'name slug image - description');
        if (!subCategory) {
            throw new Error('SubCategory not found', 404);
        }
        return subCategory;
    } catch (error) {
        throw new Error(`Error fetching subCategory: ${error.message}`);
    }
};

export const createSubCategory = async(subCategoryData) =>{
    try {     
        if (!subCategoryData.slug) {
            if (!subCategoryData.name) {
                throw new Error("SubCategory name is required");
            }

            subCategoryData.slug = slugify(subCategoryData.name, { lower: true });

        }

        
        const existingSubCategory = await SubCategory.findOne({
            $or: [
                { name: subCategoryData.name },
                { slug: subCategoryData.slug }
            ]
        });
        if (existingSubCategory) {
            throw new Error("SubCategory with this name or slug already exists");
        }
        let subCategory = new SubCategory(subCategoryData);
        await subCategory.save();
        return subCategory;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Error creating subCategory: ${error.message}`);
    }
}

export const getSubCategoryByIdOrSlug = async (idOrSlug) => {
    try {
        let subCategory;
        const query = idOrSlug.includes('-') ? { slug: idOrSlug } : { _id: idOrSlug };
        if(/^[0-9a-fA-F]{24}$/.test(idOrSlug)){
            subCategory = await SubCategory.findById(idOrSlug);
        } else {
            subCategory = await SubCategory.findOne(query);
        }
        if (!subCategory) {
            throw new Error('SubCategory not found', 404);
        }
        return subCategory;
    } catch (error) {
        throw new Error(`Error fetching subCategory: ${error.message}`);
    }
};

export const updateSubCategoryById = async (id, subCategoryData) => {
    try {
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            throw new Error('SubCategory not found', 404);
        }
        Object.assign(subCategory, subCategoryData);
        await subCategory.save();
        return subCategory;
    } catch (error) {
        throw new Error(`Error updating subCategory: ${error.message}`);
    }
};
export const deleteSubCategory = async (id) => {
  try {
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      throw new Error('SubCategory not found', 404);
    }
    // Check for products using this subCategory
    const productsCount = await Product.countDocuments({ subCategory: id });
    if (productsCount > 0) {
      throw new Error(
        `Cannot delete subCategory with ${productsCount} associated products`,
        400
      );
    }
    
    // Check for child categories
    const childrenCount = await SubCategory.countDocuments({ parent: id });
    if (childrenCount > 0) {
      throw new Error(
        `Cannot delete subCategory with ${childrenCount} child categories`,
        400
      );
    }
     await SubCategory.deleteOne({ _id: id });
     return true
  } catch (error) {
    console.log(`Error deleting subCategory: ${error.message}`);
  }
};