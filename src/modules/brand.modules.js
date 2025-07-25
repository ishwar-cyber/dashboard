import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Brand name is Required'],
        unique: true,
        trim: true
    },
    slug:{
        type: String,
        lowercase: true,
        unique: true,
        index: true
    },
    image:{
        url: String,
        public_id: String
    },
    isActive:{
        type: Boolean,
        default: true
    },
    metaTitle: String,
    metaDescription: String,
},{ timestamps: true, toJSON: { virtuals: true }, toObject:{virtuals: true} });
BrandSchema.set('toJSON', { virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
 });

 BrandSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'brand'
 })

const Brand = mongoose.model('Brand', BrandSchema);

export default Brand;
