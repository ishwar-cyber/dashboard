import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subcategory is Required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is Required']
    },
    image: {
        type: String,
    },
    status: {
        type: String,
        default: true
    }
}, { timestamps: true });
subCategorySchema.set('toJSON', 
        { virtuals: true,  transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
);


const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;