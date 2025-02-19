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
            required: true
        },
        price:{
            type: Number,
            required: [true, 'Product price required'],
            min: [0, 'Price must be greater then 0']
        },
        category:{
            type: String,
            required: true
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
            type: String,
            required: true
        }
    },{timestamps: true}
);

const Product = mongoose.model('product',productSchema,)

export default Product;