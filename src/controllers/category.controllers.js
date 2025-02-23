import Category from "../modules/category.modules.js";
export const create = async (req, res) => {
    try {
        const { name, categoryLogo } = req.body;
        const existingCategory = await Category.findOne({name});
        if (existingCategory) {
            const error = new Error("Category already exists");
            error.statusCode = 409;
            throw error;
        }
        let category = new Category({name, categoryLogo});
        await category.save();
        res.status(200).json({
            success: true,
            message: "Category added successfully",
            data: category
        });

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};