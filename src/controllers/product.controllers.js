import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import Pincode from '../models/service_pincode.model.js';
import SubCategory from '../models/sub_category.model.js';
import { uploadFile ,uploadFiles} from "../utilities/cloudnary.js";
import { create } from "../services/product.service.js";
export const createProduct = async(req, res, next)=>{
    try {
        const productData = {...req.body};
        if(productData.price) productData.price = parseFloat(productData.price);
        if(productData.discount) productData.discount = parseFloat(productData.discount);
        // if(productData.stock) productData.stock = parseInt(productData.stock);
        res.status(200).json({
            success: true,
            message: "add new product",
            data: await create(productData)
        })
    } catch (error) {
        next(error)
    }
}
export const getAllProducts = async (req, res) => {
  try {
    const { category, subCategory, brand, minPrice, maxPrice, search } = req.query;

    const filter = {};

    // 🔹 Category filter
    if (category) {
      filter['category.slug'] = category.toLowerCase(); // or category.name if using name
    }

    // 🔹 Subcategory filter
    if (subCategory) {
      filter['subCategory.slug'] = subCategory.toLowerCase();
    }

    // 🔹 Brand filter
    if (brand) {
      filter['brand.slug'] = brand.toLowerCase();
    }

    // 🔹 Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // 🔹 Text search
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    filter.status = true;
    // filter.stock = 'in';
     const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
  }
};

export const findRelatedProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    // 1. Get the base product
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Query for related products
    const query = {
      category: product.category,
      _id: { $ne: product._id } // exclude current product
    };

    // Optional: also match brand
    if (product.brand) {
      query.brand = product.brand;
    }

    // Optional: match any tags
    // if (product.tags && product.tags.length > 0) {
    //   query.tags = { $in: product.tags };
    // }

    const relatedProducts = await Product.find(query)
      .limit(4) // Limit to 4
    //   .select("name price image category brand") // Fields to return
      .populate("category", "name")
      .populate("brand", "name");

    res.json(relatedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const { categories, brands, minPrice, maxPrice } = req.query;
    const filter = {};

    // 🔹 Category filter (supports multiple)
    if (categories) {
      const categoryList = categories.split(",").map((c) => c.trim());
      const categoryDocs = await Category.find({
        $or: [
          { slug: { $in: categoryList } },
          { name: { $in: categoryList } }
        ],
      }).select("_id");

      if (categoryDocs.length > 0) {
        filter.category = { $in: categoryDocs.map((c) => c._id) };
      }
    }

    // 🔹 Brand filter (supports multiple)
    if (brands) {
      const brandList = brands.split(",").map((b) => b.trim());
      const brandDocs = await Brand.find({ name: { $in: brandList } }).select("_id");

      if (brandDocs.length > 0) {
        filter.brand = { $in: brandDocs.map((b) => b._id) };
      }
    }

    // 🔹 Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    filter.status = true;
    filter.stock = 'in';
    // 🔹 Fetch products with populated refs
    const products = await Product.find(filter)
      .populate("brand", "name")
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchProduct = async (req, res) => {
  try {
    const query = req.query.products || '';
    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Only search product name (case-insensitive)
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },               // Product name
        { 'brand.name': { $regex: query, $options: 'i' } },       // Brand name
        { 'category.name': { $regex: query, $options: 'i' } },    // Category name
        { description: { $regex: query, $options: 'i' } }         // Description
      ] 
    }).limit(20);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
 try {
    const { slug } = req.params;
    if(!slug) {
      return res.status(400).json({ success: false, message: 'Product slug is required' });
    }

    const product = await Product.findOne({ slug: slug.toLowerCase() })
      .populate('category', 'name slug')
      .populate('pincode', 'pincode')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
  }
};

export const getProductByCategoryId = async (req, res) => {
    try {
        const slug = req.params.slug;

        // Find category by slug
        const category = await Category.findOne({ slug }).lean();
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Find products linked to this category
        const products = await Product.find({
            category: category._id
        }).lean();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getProductBySubCategorySlug = async(req, res)=>{
   try {
        const slug = req.params.subSlug;

        // Find category by slug
        const subCategory = await SubCategory.findOne({ slug }).lean();
        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: 'Sub Category not found'
            });
        }

        // Find products linked to this category
        const products = await Product.find({
            subCategory: subCategory._id
        }).lean();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
export const deleteProduct = async(req, res)=>{
    try {
        let id = req.params.id;
        let productDetails = await Product.findByIdAndDelete(id);
        res.status(200).json({
            status: "deleted product successfully",
            data: productDetails
        }) 
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}
export const updateProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {...req.body };

    // ✅ Numeric fields
    ['price', 'weight', 'length', 'height', 'width'].forEach((field) => {
      if (updates[field] !== undefined) {
        updates[field] = parseFloat(updates[field]);
      }
    });

    // ✅ Stock (string)
    if (updates.stock !== undefined) {
      updates.stock = String(updates.stock);
    }

    // ✅ Warranty
    if (updates.warranty) {
      updates.warranty = [
        {
          period: updates.warranty.period,
          type: updates.warranty.type,
          details: updates.warranty.details,
        },
      ];
    }

    // ✅ Variants (FIXED HERE)
    if (updates.variants && Array.isArray(updates.variants)) {
      updates.variants = updates.variants.map((variant) => ({
        name: variant.name,
        sku: variant.sku,
        price: parseFloat(variant.price) || 0,
        stock: variant.stock || 'in',
        image: Array.isArray(variant.image) && variant.image.length > 0
          ? variant.image[0] // ✅ FIXED: pick object, not array
          : variant.image || null,
      }));
    }
    // ✅ Pincode
    if (updates.pincode && Array.isArray(updates.pincode)) {
      updates.pincode = updates.pincode.map((p) => p.id || p.name || p);
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};


export const uploadImages = async(req, res)=>{
    const file = req.files['image'];
    let image = {};
    if(file.length >= 1) {
        image = file ? await uploadFiles(file) : null;        
    } else {
       image = file ? await uploadFile(file) : null;  
    }
    res.status(200).json({
        success: true,
        message: "url created",
        data: image,
    });
}

export const searchProducts = async (req, res) => {
  try {
    const q = req.query.q || "";

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { categoryName: { $regex: q, $options: "i" } },
        { subcategoryName: { $regex: q, $options: "i" } }
      ]
    })
      .limit(8)
      .select("name slug images category subcategory");
    products.stock = 'in';
    res.json(products);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

