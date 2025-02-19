import Brand from "../modules/brand.modules.js";

export const create = async (req, res) => {
    try {
        const { name } = req.body;
        const brandLogo = req.file ? req.file.filename : null;

        console.log('file name for image', req);

        let existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            const error = new Error("Brand is already created");
            error.statusCode = 409;
            throw error;
        }

        let brand = new Brand({ name, brandLogo });
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
