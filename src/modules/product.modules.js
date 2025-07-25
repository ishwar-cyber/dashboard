import mongoose from "mongoose";

const Schema = mongoose.Schema;
const VariantSchema = new Schema(
    {
        name:{
            type: String,
            trim:true
        },
        sku:{
            type: String,
            trim:true
        },
        price:{
            type: Number,
            min: 0,
        },
        stock: {
            type: Number,
            min:0,
            default: 0
        },
        image:{
            type: String
        }    
    },{
        _id: true
    });
const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true
        },
        images:[{
            type: String,
        }],
        discount:{
            type: Number,
            min: 0,
            max: 100,
            default:0
        },
        slug:{
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        price: {
            type: Number,
            required: [true, 'Product price required'],
            min: [0, 'Price must be greater than 0'],
            max: [1000000, 'Price seems too high']
        },
        variants: [VariantSchema],
        category: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Changed to singular and capitalized (Mongoose convention)
            required: [true, 'At least one category is required']
        }],
        pincode :[{
            type: Number,
        }],
        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min:0,
            default: 0
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxLength: [2000, 'Description cannot exceed 2000 characters']
        },
        sku: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
            unique: true,
            maxLength: [50, 'Model cannot exceed 50 characters']
        },
        featured:{
            type: Boolean,
            default: false
        },
        bestSeller:{
            type: Boolean,
            default: false
        },
        tag:[String],
        rating:{
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        
        weight: {
            type: Number,
            required: [true, 'Product weight is required'],
            trim: true,
        },
        length :{
            type: Number,
            required: [true, 'Product lenght is required'],
            trim: true,
        },
        width:{
            type: Number,
            required: [true, 'Product width is required'],
            trim: true,
        },
        height:{
            type: Number,
            required: [true, 'Product hight is required'],
            trim: true,
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory', // Changed to singular and capitalized
            required: [true, 'Subcategory name is required']
        },
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand', // Changed to singular and capitalized
            required: [true, 'Brand name is required']
        },
        status: {
            type: Boolean,
            default: true
        },
        specifications: [{
            name: {
                type: String,
                required: [true, 'Specification name is required'],
                trim: true,
                maxLength: [50, 'Specification name cannot exceed 50 characters']
            },
            value: {
                type: String,
                required: [true, 'Specification value is required'],
                trim: true,
                maxLength: [100, 'Specification value cannot exceed 100 characters']
            }
        }],
        offerPrice: [{
            quantity: {
                type: Number,
                required: [true, 'quntity is required'],
                trim: true,
               
            },
            price: {
                type: Number,
                required: [true, 'price is required'],
                trim: true,
            }
        }],
        warranty: [
            {
                period: {
                    type: Number,
                    min: [0, 'Warranty period cannot be negative'],
                    max: [120, 'Warranty period cannot exceed 120 months']
                }, 
                type: {
                    type: String,
                    // enum: ['Manufacturer', 'Seller', 'Extended', 'Other'],
                    // default: 'Manufacturer'
                },
                details: {
                    type: String,
                    maxLength: [500, 'Warranty details cannot exceed 500 characters']
                }
            }
        ]
    },{timestamps: true,
        toJSON: { virtuals: true,},
        toObject: { virtuals: true}
    });

// Optional: Add indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', model: 'text', 'attributes.$*': 'text' });

const Product = mongoose.model('Product', ProductSchema); // Capitalized model name

export default Product;