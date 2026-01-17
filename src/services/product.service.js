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
        description: true,
        warranties: true,
        offerPrices: true,

        specifications:{select: {id: true, name: true, value: true}},
        images: { take: 5, select: { url: true, publicId: true } },
        category: { select: { name: true, slug: true, id: true } },
        subCategory: { select: { name: true, slug: true, id: true } },
        brand: { select: { name: true, slug: true, id: true } },
        variants: {
          select: { id: true, name: true, sku: true, price: true,stock: true, 
            images: {
              select: { id: true, url: true, publicId: true }
            }
          }
        },

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


export const createProduct = async (data) => {
  if (!data.categoryId || !data.subCategoryId || !data.brandId) {
    throw new Error("categoryId, subCategoryId and brandId are required");
  }

  const exists = await prisma.product.findFirst({
    where: {
      OR: [
        { name: data.name },
        { slug: data.slug },
        ...(data.sku ? [{ sku: data.sku }] : [])
      ]
    }
  });

  if (exists) {
    throw new Error("Product with same name / slug / sku already exists");
  }

  return prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      sku: data.sku,

      price: data.price,
      discount: data.discount,
      stock: data.stock,
      rating: data.rating,

      status: data.status,
      featured: data.featured,
      bestSeller: data.bestSeller,

      serviceCharges: data.serviceCharges,

      weight: data.weight,
      length: data.length,
      width: data.width,
      height: data.height,

      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      brandId: data.brandId,

      images: data.images.length
        ? { createMany: { data: data.images } }
        : undefined,

      specifications: data.specifications.length
        ? { createMany: { data: data.specifications } }
        : undefined,

      offerPrices: data.offerPrices.length
        ? {
            createMany: {
              data: data.offerPrices.map(o => ({
                quantity: Number(o.quantity),
                price: Number(o.price)
              }))
            }
          }
        : undefined,

      warranties: data.warranties.length
        ? {
            createMany: {
              data: data.warranties.map(w => ({
                period: Number(w.period),
                type: w.type
              }))
            }
          }
        : undefined,

      variants: data.variants.length
        ? {
            create: data.variants.map(v => ({
              name: v.name,
              sku: v.sku,
              price: Number(v.price),
              stock: Number(v.stock),
              images: v.images?.length
                ? {
                    createMany: {
                      data: v.images.map(img => ({
                        url: img.url,
                        publicId: img.publicId
                      }))
                    }
                  }
                : undefined
            }))
          }
        : undefined
    }
  });
};


/* ===============================
   UPDATE PRODUCT (NEW – SAFE)
================================ */
export const updateProductById = async (productId, payload) => {
  const id = Number(productId);
  return prisma.$transaction(async (tx) => {
    /* ---------- UPDATE PRODUCT CORE ---------- */
    await tx.product.update({
      where: { id: id},
      data: {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        status: payload.status,
        weight: payload.weight,
        width: payload.width,
        height: payload.height,
        length: payload.length,
        categoryId: payload.categoryId,
        subCategoryId: payload.subCategoryId,
        brandId: payload.brandId
      }
    });


  /* ---------- SYNC PRODUCT IMAGES ---------- */
  if (Array.isArray(payload.images)) {

    // 1. Get DB images
    const dbImages = await tx.productImage.findMany({
      where: { productId: id }
    });

    const payloadIds = payload.images
      .filter(img => img.id)
      .map(img => img.id);

    /* ---------- DELETE REMOVED IMAGES ---------- */
    await tx.productImage.deleteMany({
      where: {
        productId: id,
        id: { notIn: payloadIds }
      }
    });

    /* ---------- UPDATE / CREATE ---------- */
    for (const img of payload.images) {

      // ❌ skip invalid publicId
      if (!img.url) continue;

      // UPDATE
      if (img.id) {
        await tx.productImage.update({
          where: { id: img.id },
          data: {
            url: img.url,
            publicId: img.publicId || null
          }
        });
      }
      // CREATE
      else {
        await tx.productImage.create({
          data: {
            productId: id,
            url: img.url,
            publicId: img.publicId || null
          }
        });
      }
    }
  }


    /* ---------- SYNC SPECIFICATIONS ---------- */
    if (Array.isArray(payload.specifications)) {
      await syncSpecifications(tx, id, payload.specifications);
    }

    /* ---------- SYNC OFFER PRICES ---------- */
    if (Array.isArray(payload.offerPrices)) {
      await syncOfferPrices(tx, id, payload.offerPrices);
    }

    /* ---------- SYNC WARRANTIES ---------- */
    if (Array.isArray(payload.warranties)) {      
      await syncWarranty(tx, id, payload.warranties);
    }

    if(Array.isArray(payload.variants)){
      await syncVariants(tx, id, payload.variants);
    }


    return tx.product.findUnique({
      where: { id: id },
      include: {
        specifications: true,
        offerPrices: true,
        warranties: true,
        variants: true,
        images: true
      }
    });
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

async function syncSpecifications(tx, productId, specs = []) {
  if (!Array.isArray(specs) || specs.length === 0) return;

  /* 1️⃣ Fetch ALL existing specs */
  const existingSpecs = await tx.productSpecification.findMany({
    where: { productId }
  });

  /* 2️⃣ Build lookup maps */
  const existingById = new Map(
    existingSpecs.map(s => [s.id, s])
  );

  const existingByKey = new Map(
    existingSpecs.map(s => [
      `${s.name?.trim()}::${s.value?.trim()}`,
      s
    ])
  );

  /* 3️⃣ UPDATE only if changed */
  for (const spec of specs) {
    if (spec.id && existingById.has(spec.id)) {
      const existing = existingById.get(spec.id);

      const nameChanged =
        (existing.name || '') !== (spec.name || '');
      const valueChanged =
        (existing.value || '') !== (spec.value || '');

      if (nameChanged || valueChanged) {
        await tx.productSpecification.update({
          where: { id: spec.id },
          data: {
            name: spec.name,
            value: spec.value
          }
        });
      }
    }
  }

  /* 4️⃣ CREATE only truly new specs */
  const newSpecs = specs.filter(spec => {
    if (spec.id) return false;

    const key = `${spec.name?.trim()}::${spec.value?.trim()}`;
    return !existingByKey.has(key);
  });

  if (newSpecs.length > 0) {
    await tx.productSpecification.createMany({
      data: newSpecs.map(spec => ({
        productId,
        name: spec.name,
        value: spec.value
      }))
    });
  }
}

async function syncOfferPrices(tx, productId, offerPrices = []) {
  const existingIds = offerPrices.filter(o => o.id).map(o => o.id);

  /* UPDATE existing */
  for (const o of offerPrices) {
    if (o.id) {
      await tx.productOfferPrice.update({
        where: { id: o.id },
        data: {
          quantity: Number(o.quantity),
          price: Number(o.price)
        }
      });
    }
  }

  /* CREATE new */
  const newRows = offerPrices.filter(o => !o.id);
  if (newRows.length) {
    await tx.productOfferPrice.createMany({
      data: newRows.map(o => ({
        productId,
        quantity: Number(o.quantity),
        price: Number(o.price)
      }))
    });
  }

  /* DELETE removed */
  await tx.productOfferPrice.deleteMany({
    where: {
      productId,
      id: { notIn: existingIds }
    }
  });
}

async function syncWarranty(tx, productId, warranties) {
 const [warranty] = warranties || [];
  if (!warranty) return;

  // 1️⃣ Fetch existing warranty (single row)
  const existing = await tx.productWarranty.findFirst({
    where: { productId }
  });
  // 2️⃣ Update if exists
  if (existing) {
    // Optional diff check

    if (
      existing.period !== Number(warranty.period) ||
      existing.type !== warranty.type
    ) {
      await tx.productWarranty.update({
        where: { id: existing.id },
        data: {
          period: Number(warranty.period),
          type: warranty.type
        }
      });
    }
    return;
  }
  
  // 3️⃣ Create if not exists
  await tx.productWarranty.create({
    data: {
      productId,
      period: Number(warranty.period),
      type: warranty.type
    }
  });
}



export async function syncVariants(tx, productId, variants = []) {
  if (!Array.isArray(variants)) return;

  /* 1️⃣ Fetch DB variants */
  const dbVariants = await tx.productVariant.findMany({
    where: { productId },
    include: { images: true }
  });

  const dbById = new Map(dbVariants.map(v => [v.id, v]));
  const payloadIds = variants.filter(v => v.id).map(v => v.id);

  /* 2️⃣ DELETE REMOVED VARIANTS */
  const removedIds = dbVariants
    .map(v => v.id)
    .filter(id => !payloadIds.includes(id));

  if (removedIds.length) {
    await tx.productVariantImage.deleteMany({
      where: { variantId: { in: removedIds } }
    });

    await tx.productVariant.deleteMany({
      where: { id: { in: removedIds } }
    });
  }

  /* 3️⃣ UPDATE EXISTING VARIANTS */
  for (const v of variants) {
    if (!v.id || !dbById.has(v.id)) continue;

    await tx.productVariant.update({
      where: { id: v.id },
      data: {
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        stock: Number(v.stock)
      }
    });

    /* 4️⃣ SYNC VARIANT IMAGES */
    if (Array.isArray(v.images)) {
      await syncVariantImages(tx, v.id, v.images);
    }
  }

  /* 5️⃣ CREATE NEW VARIANTS */
  const newVariants = variants.filter(v => !v.id);

  for (const v of newVariants) {
    const created = await tx.productVariant.create({
      data: {
        productId,
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        stock: Number(v.stock)
      }
    });

    if (Array.isArray(v.images) && v.images.length) {
      await tx.productVariantImage.createMany({
        data: v.images.map(img => ({
          variantId: created.id,
          url: img.url,
          publicId: img.publicId ?? null
        }))
      });
    }
  }
}

async function syncVariantImages(tx, variantId, images = []) {
  if (!Array.isArray(images)) return;

  const dbImages = await tx.productVariantImage.findMany({
    where: { variantId }
  });

  const payloadIds = images.filter(i => i.id).map(i => i.id);

  /* DELETE removed images */
  await tx.productVariantImage.deleteMany({
    where: {
      variantId,
      id: { notIn: payloadIds }
    }
  });

  /* UPDATE / CREATE */
  for (const img of images) {
    if (img.id) {
      await tx.productVariantImage.update({
        where: { id: img.id },
        data: {
          url: img.url,
          publicId: img.publicId ?? null
        }
      });
    } else {
      await tx.productVariantImage.create({
        data: {
          variantId,
          url: img.url,
          publicId: img.publicId ?? null
        }
      });
    }
  }
}




