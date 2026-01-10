import prisma from "../config/prisma.js";
import slugify from "slugify";
import { toBoolean } from "../utilities/helper.js";
/* ===============================
   GET ALL PRODUCTS (LIST)
================================ */
export const getAllProducts = async (options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 12;
  const skip = (page - 1) * limit;

  const where = {
    status: true,
    ...(options.search && {
      OR: [
        { name: { contains: options.search, mode: "insensitive" } },
        { slug: { contains: options.search, mode: "insensitive" } }
      ]
    })
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        discount: true,
        weight: true,
        height: true,
        width: true,
        length: true,
        stock: true,
        status: true,
        specifications: true,
        description: true,
        warranties: true,
        variants: true,
        offerPrices: true,
        images: { take: 1, select: { url: true } },
        category: { select: { name: true, slug: true } },
        subCategory: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        updatedAt: true
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/* ===============================
   GET PRODUCT BY SLUG
================================ */
export const getProductBySlug = async (slug) => {
  return prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      status: true,
      description: true,
      price: true,
      discount: true,
      stock: true,
      images: true,
      category: true,
      subCategory: true,
      brand: true,
      variants: true,
      specifications: true,
      pincodes: true
    }
  });
};

/* ===============================
   CREATE PRODUCT
================================ */
export const createProduct = async (data) => {
  // Duplicate protection
  console.log('wotkinggg', data);
  
  const exists = await prisma.product.findFirst({
    where: {
      OR: [
        { name: data.name },
        { slug: data.slug },
        ...(data.sku ? [{ sku: data.sku }] : [])
      ]
    },
    select: { id: true }
  });

  if (exists) {
    throw new Error("Product with same name / slug / sku already exists");
  }

  return prisma.product.create({
    data
  });
};


/* ===============================
   UPDATE PRODUCT (NEW – SAFE)
================================ */
export const updateProductById = async (id, payload) => {
  const productId = Number(id);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!existing) throw new Error('Product not found');

    /* -------------------- PRODUCT UPDATE -------------------- */
    await tx.product.update({
      where: { id: productId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.slug && { slug: payload.slug }),

        ...(payload.price !== undefined && { price: Number(payload.price) }),
        ...(payload.stock !== undefined && { stock: Number(payload.stock) }),

        ...(toBoolean(payload.status !== undefined) && { status: toBoolean(payload.status) }),

        ...(payload.weight !== undefined && { weight: Number(payload.weight) }),
        ...(payload.width !== undefined && { width: Number(payload.width) }),
        ...(payload.height !== undefined && { height: Number(payload.height) }),
        ...(payload.length !== undefined && { length: Number(payload.length) }),

        ...(payload.serviceCharge !== undefined && {
          serviceCharge: Number(payload.serviceCharge)
        }),

        ...(payload.brand && { brandId: Number(payload.brand) }),
        ...(payload.category && { categoryId: Number(payload.category) }),
        ...(payload.subCategory && { subCategoryId: Number(payload.subCategory) }),

        ...(payload.description && { description: payload.description })
      }
    });

    /* -------------------- PRODUCT IMAGES -------------------- */
    if (Array.isArray(payload.productImages)) {
      await tx.productImage.deleteMany({ where: { productId } });

      await tx.productImage.createMany({
        data: payload.productImages.map((img) => ({
          productId,
          url: img.url,
          publicId: img.publicId
        }))
      });
    }

    /* -------------------- WARRANTY -------------------- */
    if (payload.warranty) {
      await tx.warranty.deleteMany({ where: { productId } });

      await tx.warranty.create({
        data: {
          productId,
          period: payload.warranty.period,
          type: payload.warranty.type
        }
      });
    }

    /* -------------------- SPECIFICATIONS -------------------- */
    if (Array.isArray(payload.specifications)) {
      await tx.specification.deleteMany({ where: { productId } });

      await tx.specification.createMany({
        data: payload.specifications.map((s) => ({
          productId,
          name: s.name,
          value: s.value
        }))
      });
    }

    /* -------------------- OFFER PRICE -------------------- */
    if (Array.isArray(payload.offerPrice)) {
      await tx.offerPrice.deleteMany({ where: { productId } });

      await tx.offerPrice.createMany({
        data: payload.offerPrice.map((o) => ({
          productId,
          quantity: Number(o.quantity),
          price: Number(o.price)
        }))
      });
    }

    /* -------------------- VARIANTS -------------------- */
    if (Array.isArray(payload.variants)) {
      await tx.variant.deleteMany({ where: { productId } });

      for (const variant of payload.variants) {
        const createdVariant = await tx.variant.create({
          data: {
            productId,
            name: variant.name,
            sku: variant.sku,
            price: Number(variant.price),
            stock: Number(variant.stock)
          }
        });

        if (Array.isArray(variant.images)) {
          await tx.variantImage.createMany({
            data: variant.images.map((img) => ({
              variantId: createdVariant.id,
              url: img.url,
              publicId: img.publicId
            }))
          });
        }
      }
    }

    return { success: true, message: 'Product updated successfully' };
  });
};


/* ===============================
   DELETE PRODUCT (NEW – SAFE)
================================ */
export const deleteProductById = async (id) => {
  const productId = Number(id);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) throw new Error("Product not found");

    await tx.product.delete({ where: { id: productId } });

    return true;
  });
};

/* ===============================
   RELATED PRODUCTS
================================ */
export const getRelatedProducts = async (productId, categoryId) => {
  return prisma.product.findMany({
    where: {
      categoryId,
      id: { not: productId },
      status: true
    },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { take: 1, select: { url: true } }
    }
  });
};
/* ===============================
   GET PRODUCTS BY IDS
================================ */

export const getProductsByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  // 🔹 Normalize & dedupe IDs
  const productIds = [...new Set(ids.map(Number))];

  return prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: true
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      stock: true,
      images: {
        take: 1,
        select: { url: true }
      },
      category: {
        select: { id: true, name: true }
      },
      brand: {
        select: { id: true, name: true }
      }
    }
  });
};

/* ===============================
   SEARCH PRODUCTS (FAST)
================================ */
export const searchProducts = async (query, limit = 10) => {
  if (!query || !query.trim()) return [];

  return prisma.product.findMany({
    where: {
      status: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          brand: {
            name: { contains: query, mode: "insensitive" }
          }
        },
        { category: {
            name: { contains: query, mode: "insensitive" }
          }
        },

      ]
    },
    take: Number(limit),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: {
        take: 1,
        select: { url: true }
      }
    }
  });
};

/* ===============================
   GET PRODUCTS BY CATEGORY ID
================================ */
export const getProductByCategorySlug = async (options = {}) => {
  const {
    slug,          // category slug
    page = 1,
    limit = 12,
    search,
    minPrice,
    maxPrice
  } = options;

  const skip = (page - 1) * limit;

  // 🔹 Step 1: Find category by slug
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true }
  });

  // ❗ Category not found
  if (!category) {
    return {
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    };
  }

  // 🔹 Step 2: Build product filter
  const where = {
    status: true,
    categoryId: category.id,

    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ]
    }),

    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) })
          }
        }
      : {})
  };

  // 🔹 Step 3: Fetch products + count
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        discount: true,
        stock: true,
        images: { take: 1, select: { url: true } },
        brand: { select: { name: true, slug: true } }
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};


/* =========================================
   GET PRODUCTS BY SUBCATEGORY SLUG
========================================= */
export const getProductBySubCategorySlug = async (options = {}) => {
  console.log('sub options', options);
  
  const {
    slug,
    page = 1,
    limit = 12,
    search,
    minPrice,
    maxPrice
  } = options;

  const skip = (page - 1) * limit;

  // 🔹 Step 1: Find subcategory by slug
  const subCategory = await prisma.subCategory.findUnique({
    where: { slug },
    select: { id: true }
  });
   
  if (!subCategory) {
    return {
      products: [],
      pagination: { page, limit, total: 0, pages: 0 }
    };
  }
  console.log('sub category id', subCategory);
  
  const where = {
    status: true,
    subCategoryId: subCategory.id,

    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ]
    }),

    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) })
          }
        }
      : {})
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        price: true,
        discount: true,
        stock: true,
        category: { select: { name: true, slug: true } },
        subCategory: { select: { name: true, slug: true } },
        images: { take: 1, select: { url: true } },
        brand: { select: { name: true, slug: true } }
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
