import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Category is Requied']
    },
    image:{
        type: String,
    },
    status:{
        type: Boolean,
        default: true
    }
},{ timestamps: true, toJSON: { virtuals: true } });
categorySchema.set('toJSON', 
    { virtuals: true, 
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
