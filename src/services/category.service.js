import Category from '../modules/category.modules.js';
import slugify from 'slugify';


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
