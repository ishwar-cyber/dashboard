import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Brand is Requied']
    },
    image:{
        type: String,
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    description:{
        type: String,
    },
},{ timestamps: true, toJSON: { virtuals: true } });
brandSchema.set('toJSON', { virtuals: true });

const Brand = mongoose.model('brand', brandSchema);

export default Brand;
