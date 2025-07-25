import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subcategory name is Required'],
        trim: true
    },
    slug:{
        type: String,
        lowercase: true,
        unique: true,
        index: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is Required']
    },
    image: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metaTitle: String,
    metaDescription: String,
}, { timestamps: true,toJSON: {virtuals: true}, toObject: { virtuals: true} });


SubCategorySchema.virtual('products',{
    ref: 'Product',
    localField: '_id',
    foreignField: 'subCategory'
});
const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

export default SubCategory;