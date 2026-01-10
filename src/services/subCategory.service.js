import slugify from "slugify";
import prisma from "../config/prisma.js";

/* ======================================
   GET ALL SUBCATEGORIES (FAST, NO N+1)
====================================== */
export const getAllSubCategories = async (options = {}) => {
  try {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(options.isActive !== undefined && {
        isActive: options.isActive === "true"
      }),
      ...(options.search && {
        name: { contains: options.search, mode: "insensitive" }
      })
    };

    // 🔥 Parallel DB calls
    const [subCategories, total, productCounts] = await Promise.all([
      prisma.subCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          serviceCharges: true,
          isActive: true,
          createdAt: true,
          category: {
            select: { id: true, name: true }
          }
        }
      }),

      prisma.subCategory.count({ where }),

      prisma.product.groupBy({
        by: ["subCategoryId"],
        _count: { _all: true }
      })
    ]);

    // 🔹 Map product count efficiently
    const countMap = {};
    productCounts.forEach(p => {
      countMap[p.subCategoryId] = p._count._all;
    });

    const result = subCategories.map(sc => ({
      ...sc,
      productCount: countMap[sc.id] || 0
    }));

    return {
      subCategories: result,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Error fetching subCategories: ${error.message}`);
  }
};

/* ======================================
   GET SUBCATEGORY BY ID
====================================== */
export const getSubCategoryByIdService = async (id) => {
  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        slug: true,
        serviceCharges: true,
        isActive: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: { select: { url: true } }
          }
        }
      }
    });

    if (!subCategory) throw new Error("SubCategory not found");
    return subCategory;
  } catch (error) {
    throw new Error(`Error fetching subCategory: ${error.message}`);
  }
};

/* ======================================
   CREATE SUBCATEGORY (DB ONLY)
====================================== */
export const createSubCategory = async (subCategoryData) => {
  try {
    if (!subCategoryData.name) {
      throw new Error("SubCategory name is required");
    }

    const slug =
      subCategoryData.slug ||
      slugify(subCategoryData.name, { lower: true, strict: true });

    const existing = await prisma.subCategory.findFirst({
      where: {
        OR: [{ name: subCategoryData.name }, { slug }]
      },
      select: { id: true }
    });

    if (existing) {
      throw new Error("SubCategory with this name or slug already exists");
    }

    return await prisma.subCategory.create({
      data: {
        name: subCategoryData.name,
        slug,
        serviceCharges: Number(subCategoryData.serviceCharges) || 0,
        isActive: subCategoryData.isActive ?? true,
        categoryId: Number(subCategoryData.category),

        ...(subCategoryData.image && {
          image: {
            create: {
              url: subCategoryData.image.url,
              publicId: subCategoryData.image.public_id
            }
          }
        })
      }
    });
  } catch (error) {
    throw new Error(`Error creating subCategory: ${error.message}`);
  }
};

/* ======================================
   GET SUBCATEGORY BY ID OR SLUG
====================================== */
export const getSubCategoryByIdOrSlug = async (idOrSlug) => {
  try {
    const where = isNaN(Number(idOrSlug))
      ? { slug: idOrSlug }
      : { id: Number(idOrSlug) };

    const subCategory = await prisma.subCategory.findUnique({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        serviceCharges: true,
        isActive: true,
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!subCategory) throw new Error("SubCategory not found");
    return subCategory;
  } catch (error) {
    throw new Error(`Error fetching subCategory: ${error.message}`);
  }
};

/* ======================================
   UPDATE SUBCATEGORY (NO UPLOAD)
====================================== */
export const updateSubCategoryById = async (id, subCategoryData) => {
  try {
    const subCategoryId = Number(id);

    const existing = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true }
    });

    if (!existing) throw new Error("SubCategory not found");

    return await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: {
        ...(subCategoryData.name && { name: subCategoryData.name }),
        ...(subCategoryData.slug && { slug: subCategoryData.slug }),
        ...(subCategoryData.serviceCharges !== undefined && {
          serviceCharges: Number(subCategoryData.serviceCharges)
        }),
        ...(subCategoryData.isActive !== undefined && {
          isActive:
            subCategoryData.isActive === true ||
            subCategoryData.isActive === "true"
        }),
        ...(subCategoryData.category && {
          categoryId: Number(subCategoryData.category)
        }),

        ...(subCategoryData.image && {
          image: {
            upsert: {
              create: {
                url: subCategoryData.image.url,
                publicId: subCategoryData.image.public_id
              },
              update: {
                url: subCategoryData.image.url,
                publicId: subCategoryData.image.public_id
              }
            }
          }
        })
      }
    });
  } catch (error) {
    throw new Error(`Error updating subCategory: ${error.message}`);
  }
};

/* ======================================
   DELETE SUBCATEGORY (TRANSACTION SAFE)
====================================== */
export const deleteSubCategory = async (id) => {
  const subCategoryId = Number(id);

  try {
    return await prisma.$transaction(async (tx) => {
      const subCategory = await tx.subCategory.findUnique({
        where: { id: subCategoryId },
        select: { id: true }
      });

      if (!subCategory) throw new Error("SubCategory not found");

      const productsCount = await tx.product.count({
        where: { subCategoryId }
      });

      if (productsCount > 0) {
        throw new Error(
          `Cannot delete subCategory with ${productsCount} associated products`
        );
      }

      await tx.subCategory.delete({
        where: { id: subCategoryId }
      });

      return true;
    });
  } catch (error) {
    throw new Error(`Error deleting subCategory: ${error.message}`);
  }
};

/* ======================================
   GET SUBCATEGORIES BY CATEGORY
====================================== */
export const getSubCategoriesByCategoriesService = async (id) => {
  try {
    return await prisma.subCategory.findMany({
      where: {
        categoryId: Number(id),
        isActive: true
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true
      }
    });
  } catch (error) {
    throw new Error(`Error fetching subCategories: ${error.message}`);
  }
};
