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
        type: Boolean,
        default: true
    },
    description:{
        type: String,
    },
},{ timestamps: true, toJSON: { virtuals: true } });
brandSchema.set('toJSON', { virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
 });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
