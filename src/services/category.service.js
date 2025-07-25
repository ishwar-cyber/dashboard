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
