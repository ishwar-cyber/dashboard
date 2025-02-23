import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required: [true,'Product name is required'],
            trim:true,
        },
        image:{
            type: String,
            required: [true, 'Product image required']
        },
        price:{
            type: Number,
            required: [true, 'Product price required'],
            min: [0, 'Price must be greater then 0']
        },
        category:{
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'categorys',
        },
        description:{
            type: String,
            required: true
        },
        model:{
            type: String,
            required: true
        },
        brand:{
            type:  mongoose.Schema.Types.ObjectId,
           ref: 'brands',
        }
    },{timestamps: true}
);

const Product = mongoose.model('product',productSchema,)

export default Product;