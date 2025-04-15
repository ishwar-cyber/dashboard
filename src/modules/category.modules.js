import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Category is Requied']
    },
    brand:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'brands',
        required:[true, 'Brand is Requied']
    },
    image:{
        type: String,
    },
    status:{
        type: String,
        default: true
    }
},{ timestamps: true, toJSON: { virtuals: true } });
categorySchema.set('toJSON', { virtuals: true });

const Category = mongoose.model('categories', categorySchema);

export default Category;
