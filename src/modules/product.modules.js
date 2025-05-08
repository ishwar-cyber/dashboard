import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxLength: [100, 'Product name cannot exceed 100 characters']
        },
        thumbnail: {
            type: String,
            required: [true, 'Thumbnail image required'],
            // validate: {
            //     validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
            //     message: props => `${props.value} is not a valid URL!`
            // }
        },
        price: {
            type: Number,
            required: [true, 'Product price required'],
            min: [0, 'Price must be greater than 0'],
            max: [1000000, 'Price seems too high']
        },
        variants: [
            {
                variantName: {
                    type: String,
                    required: [true, 'Variant name is required'],
                    trim: true,
                    maxLength: [1000,'Variant name cannot exceed 50 characters']
                },
                sku: {
                    type: String,
                    trim: true,
                    maxLength: [50, 'Variant name cannot exceed 50 characters']
                },
                price: {
                    type: Number,
                    min: [0, 'Price must be greater than 0']
                },
                stock: {
                    type: Number,
                    min: [0, 'Stock cannot be negative']
                },
                variantImage: {
                    type: String,
                    // validate: {
                    //     validator: (v) => !v || /^(http|https):\/\/[^ "]+$/.test(v),
                    //     message: props => `${props.value} is not a valid URL!`
                    // }
                }
            }
        ],
        category: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Changed to singular and capitalized (Mongoose convention)
            required: [true, 'At least one category is required']
        }],
        stock: {
            type: String,
            required: [true, 'Stock is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxLength: [2000, 'Description cannot exceed 2000 characters']
        },
        model: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
            maxLength: [50, 'Model cannot exceed 50 characters']
        },
        productWeight: {
            type: String,
            required: [true, 'Product weight is required'],
            trim: true,
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory', // Changed to singular and capitalized
            required: [true, 'Subcategory is required']
        },
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand', // Changed to singular and capitalized
            required: [true, 'Brand is required']
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
    },
    {
        timestamps: true,
        toJSON: { 
            virtuals: true,
            transform: function(doc, ret) {
                delete ret._id;
                if (ret.variants) {
                    ret.variants.forEach(variant => {
                        delete variant._id;
                    });
                }
                if (ret.specifications) {
                    ret.specifications.forEach(spec => {
                        delete spec._id;
                    });
                }
                if (ret.warranty) {
                    ret.warranty.forEach(warr => {
                        delete warr._id;
                    });
                }
            }
        },
        toObject: { 
            virtuals: true,
            transform: function(doc, ret) {
                delete ret._id;
                if (ret.variants) {
                    ret.variants.forEach(variant => {
                        delete variant._id;
                    });
                }
                if (ret.specifications) {
                    ret.specifications.forEach(spec => {
                        delete spec._id;
                    });
                }
                if (ret.warranty) {
                    ret.warranty.forEach(warr => {
                        delete warr._id;
                    });
                }
            }
        }
    }
);

// Optional: Add indexes for better query performance
productSchema.index({ name: 'text', description: 'text', model: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema); // Capitalized model name

export default Product;