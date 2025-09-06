import Product from "../modules/product.modules.js";
import Category from "../modules/category.modules.js";
import Brand from "../modules/brand.modules.js";
import SubCategory from '../modules/sub_category.modules.js';
import { uploadFile ,uploadFiles} from "../utilities/cloudnary.js";
import { getProducts, create } from "../services/product.service.js";
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
   const options = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        query: req.query.query,
        isActive: req.query.isActive,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        category: req.query.category,
        brand: req.query.brand,
        subCategory: req.query.subCategory,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        featured: req.query.featured
    };

    if(req.query.category) {
        options.category = req.query.category.split(',');
    }
    const result = await getProducts(options);
    res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: error.message
    });
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
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("brand", "name slug")       // only select required fields
      .populate("category", "name slug");  // populate category too

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

export const updateProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const updates = req.body; // Assuming the product data is sent in the request body
        
        
        // Find existing product
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
                errorCode: "PRODUCT_NOT_FOUND"
            });
        }

        // Handle image update - Angular 18 will typically send files as FormData
        if (req.file) {
            // Check if the new image is different from existing
            const isNewImage = req.file.originalname !== existingProduct.thumbnail?.name;
            
            if (isNewImage) {
                try {
                    // Upload new image
                    const image = await uploadFile(req.file.path);
                    updates.thumbnail = {
                        url: image,
                        name: req.file.originalname,
                        size: req.file.size,
                        lastModified: Date.now()
                    };
                    
                    // Optionally: Delete old image from storage if needed
                    // await deleteFile(existingProduct.thumbnail.url);
                } catch (uploadError) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to upload new image",
                        errorCode: "IMAGE_UPLOAD_FAILED",
                        error: uploadError.message
                    });
                }
            }
        } else {
            // If no new image provided, maintain existing thumbnail data
            // Angular might send a flag if image was removed
            if (updates.removeThumbnail === 'true') {
                updates.thumbnail = null;
                // await deleteFile(existingProduct.thumbnail.url); // If you want to delete from storage
            } else {
                updates.thumbnail = existingProduct.thumbnail;
            }
        }

        // Clean up updates object (remove Angular-specific flags)
        delete updates.removeThumbnail;

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
            changes: Object.keys(updates) // Send back which fields were updated
        });

    } catch (error) {
        // Handle validation errors separately
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errorCode: "VALIDATION_ERROR",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
            error: error.message
        });
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
