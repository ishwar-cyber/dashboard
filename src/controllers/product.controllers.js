import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProductById,
  deleteProductById,
  getRelatedProducts,
  getProductByCategorySlug,
  getProductBySubCategorySlug,
  getProductsByIds,
  searchProducts
} from "../services/product.service.js";
import slugify from "slugify";
/* ===============================
   GET PRODUCTS
================================ */
export const getProducts = async (req, res) => {
  try {
    const result = await getAllProducts(req.query);
    res.json({ success: true, data: result.products, pagination: result.pagination });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ===============================
   GET PRODUCT BY SLUG
================================ */
export const getProduct = async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ===============================
   CREATE PRODUCT
================================ */
export const create = async (req, res) => {
  try {
    const b = req.body;

    const productData = {
      /* ======================
         BASIC FIELDS
      ====================== */
      name: b.name,
      slug: slugify(b.name, { lower: true, strict: true }),
      description: b.description,
      sku: b.sku || null,

      /* ======================
         FLAGS
      ====================== */
      status: b.status === true || b.status === "true",
      featured: b.featured === true || b.featured === "true",
      bestSeller: b.bestSeller === true || b.bestSeller === "true",

      /* ======================
         NUMBERS
      ====================== */
      price: Number(b.price),
      discount: Number(b.discount || 0),
      stock: Number(b.stock || 0),
      rating: Number(b.rating || 0),

      serviceCharges: Number(b.serviceCharges || 0),

      weight: Number(b.weight),
      length: Number(b.length),
      width: Number(b.width),
      height: Number(b.height),

      /* ======================
         RELATION IDS (ONLY THESE)
      ====================== */
      categoryId: Number(b.category),
      subCategoryId: Number(b.subCategory),
      brandId: Number(b.brand),

      /* ======================
         CHILD TABLES (OPTIONAL)
      ====================== */
      ...(Array.isArray(b.images) && b.images.length > 0 && {
        images: {
          create: b.images.map(img => ({
            url: img.url,
            publicId: img.public_id || img.publicId
          }))
        }
      }),

      ...(Array.isArray(b.variants) && b.variants.length > 0 && {
        variants: {
          create: b.variants.map(v => ({
            name: v.name,
            sku: v.sku,
            price: Number(v.price || 1),
            stock: v.stock || "in",
            images: v.images
              ? {
                  create: v.images.map(img => ({
                    url: img.url,
                    publicId: img.public_id || img.publicId
                  }))
                }
              : undefined
          }))
        }
      }),

      ...(Array.isArray(b.specifications) && b.specifications.length > 0 && {
        specifications: {
          create: b.specifications.map(s => ({
            name: s.name,
            value: s.value
          }))
        }
      }),

      ...(Array.isArray(b.offerPrices) && b.offerPrices.length > 0 && {
        offerPrices: {
          create: b.offerPrices.map(o => ({
            quantity: Number(o.quantity),
            price: Number(o.price)
          }))
        }
      }),

      ...(Array.isArray(b.warranties) && b.warranties.length > 0 && {
        warranties: {
          create: b.warranties.map(w => ({
            period: Number(w.period),
            type: w.type
          }))
        }
      }),

      ...(Array.isArray(b.pincodes) && b.pincodes.length > 0 && {
        pincodes: {
          create: b.pincodes.map(p => ({
            pincode: p
          }))
        }
      }),

      ...(Array.isArray(b.tags) && b.tags.length > 0 && {
        tags: {
          create: b.tags.map(t => ({
            tag: t
          }))
        }
      })
    };

    const product = await createProduct(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/* ===============================
   UPDATE PRODUCT
================================ */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateProductById(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update product error:', error);

    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};


/* ===============================
   DELETE PRODUCT
================================ */
export const deleteProduct = async (req, res) => {
  try {
    await deleteProductById(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ===============================
   RELATED PRODUCTS
================================ */
export const relatedProducts = async (req, res) => {
  try {
    const base = await getProductBySlug(req.params.slug);
    if (!base) return res.status(404).json({ message: "Product not found" });

    const related = await getRelatedProducts(base.id, base.categoryId);
    res.json({ success: true, data: related });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ===============================
   GET PRODUCTS BY IDS
================================ */
export const getProductsByIdsController = async (req, res) => {
  try {
    const { ids } = req.body; // expects array

    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "ids must be an array"
      });
    }

    const products = await getProductsByIds(ids);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   SEARCH PRODUCT
================================ */
export const searchProduct = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const products = await searchProducts(q, limit);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   PRODUCTS BY CATEGORY
================================ */
export const getProductsByCategory = async (req, res) => {
  try {
    const result = await getProductByCategorySlug({
      slug: req.params.slug,
      ...req.query
    });
    if(!result){
      return res.status(404).json({
        success: false, 
      });
    }
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

/* ===============================
   PRODUCTS BY SUBCATEGORY SLUG
================================ */
export const getProductsBySubCategory = async (req, res) => {
  try {
    const result = await getProductBySubCategorySlug({
      slug: req.params.subSlug,
      ...req.query
    });

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