import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Category name is Required'],
        trim: true
    },
    image:{
        url: String,
        public_id: String
    },
    slug:{
        type: String,
        lowercase: true,
        unique: true,
        index: true
    },
    serviceCharges:{
        type: Number,
        default: 0
    },
    isActive:{
        type: Boolean,
        default: true
    },
    metaTitle: String,
    metaDescription: String,
},{ timestamps: true,
     toJSON: { virtuals: true },
     toObject:{ virtuals: true}
});

CategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category'
})
CategorySchema.set('toJSON', 
    { virtuals: true, 
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
);

const Category = mongoose.model('Category', CategorySchema);

export default Category;
