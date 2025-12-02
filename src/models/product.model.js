import mongoose from "mongoose";
const Schema = mongoose.Schema;

/* ---------------- Specification Schema ---------------- */
const SpecificationSchema = new Schema({
    name: {
        type: String,
        trim: true,
        maxLength: [50, 'Specification name cannot exceed 50 characters']
    },
    value: {
        type: String,
        trim: true,
        maxLength: [100, 'Specification value cannot exceed 100 characters']
    }
});

/* ---------------- Antivirus Key Schema (UPDATED) ---------------- */
const AntivirusKeySchema = new Schema({
    key: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["available", "sold", "invalid"],
        default: "available",
        trim: true
    },
    soldTo: {
        type: String, // user email or userId
        default: null
    },
    soldAt: {
        type: Date,
        default: null
    }
},
{ _id: true }
);

/* ---------------- Offer Price Schema ---------------- */
const OfferPriceSchema = new Schema({
    quantity: {
        type: Number,
        trim: true,
    },
    price: {
        type: Number,
        trim: true,
    }
});

/* ---------------- Image Schema ---------------- */
const ImageSchema = new Schema({
    url: { type: String },
    public_id: String
});

/* ---------------- Variant Schema ---------------- */
const VariantSchema = new Schema({
    name: { type: String, trim: true },
    sku: { type: String, trim: true },
    price: { type: Number, min: 1, default: 1 },
    stock: { type: String, default: 'in' },
    image: [ImageSchema]
}, { _id: true });

/* ---------------- Product Schema ---------------- */
const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true
        },

        images: [ImageSchema],

        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        slug: {
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

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'At least one category is required']
        },

        pincode: [{ type: String }],

        stock: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Stock is required']
        },

        description: {
            type: String,
            required: [true, 'Description is required'],
            maxLength: [2000, 'Description cannot exceed 2000 characters']
        },

        sku: {
            type: String,
            trim: true,
            unique: true
        },

        featured: { type: Boolean, default: false },
        bestSeller: { type: Boolean, default: false },

        tag: [String],

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        serviceCharges: { type: Number, default: 0 },

        weight: { type: Number, required: true, trim: true },
        length: { type: Number, required: true, trim: true },
        width: { type: Number, required: true, trim: true },
        height: { type: Number, required: true, trim: true },

        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory',
            required: [true, 'Subcategory name is required']
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: [true, 'Brand name is required']
        },

        status: { type: Boolean, default: true },

        specifications: [SpecificationSchema],
        offerPrice: [OfferPriceSchema],

        /* ---------------- Antivirus License Keys (UPDATED) ---------------- */
        antivirusKeys: [AntivirusKeySchema],

        warranty: [
            {
                period: {
                    type: Number,
                    min: [0, 'Warranty period cannot be negative'],
                    max: [120, 'Warranty period cannot exceed 120 months']
                },
                type: { type: String }
            }
        ]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

/* ---------------- Virtual: Auto antivirus stock ---------------- */
ProductSchema.virtual("availableAntivirusStock").get(function () {
    if (!this.antivirusKeys) return 0;
    return this.antivirusKeys.filter(k => k.status === "available").length;
});

/* ---------------- Optional: Sync stock with Antivirus keys ---------------- */
ProductSchema.pre("save", function (next) {
    if (this.antivirusKeys?.length > 0) {
        this.stock = this.antivirusKeys.filter(k => k.status === "available").length;
    }
    next();
});

/* ---------------- Export Model ---------------- */
const Product = mongoose.model('Product', ProductSchema);
export default Product;
