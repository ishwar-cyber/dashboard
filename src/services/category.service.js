import slugify from "slugify";
import prisma from "../config/prisma.js";

/* ======================================
   GET ALL CATEGORIES (FAST + NO N+1)
====================================== */
export const getAllCategories = async (options = {}) => {
  try {
    const where = {
      ...(options.isActive !== undefined && {
        isActive: options.isActive === "true"
      }),
      ...(options.search && {
        name: { contains: options.search, mode: "insensitive" }
      })
    };

    // 🔥 Parallel DB calls (FIXED)
    const [categories, productCounts] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          image: {
            select: { url: true }
          }
        }
      }),

      prisma.product.groupBy({
        by: ["categoryId"],
        _count: { _all: true }
      })
    ]);

    // 🔹 Map product count efficiently
    const countMap = {};
    productCounts.forEach(p => {
      countMap[p.categoryId] = p._count._all;
    });

    const categoriesWithProductCount = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat.id] || 0
    }));

    return { categories: categoriesWithProductCount };
  } catch (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
}

/* ======================================
   CREATE CATEGORY (DB ONLY)
====================================== */
export const createCategory = async (categoryData) => {
  try {
    if (!categoryData.name) {
      throw new Error("Category name is required");
    }

    const slug =
      categoryData.slug ||
      slugify(categoryData.name, { lower: true, strict: true });

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: categoryData.name }, { slug }]
      },
      select: { id: true }
    });

    if (existing) {
      throw new Error("Category with this name or slug already exists");
    }

    return await prisma.category.create({
      data: {
        name: categoryData.name,
        slug,
        isActive: categoryData.isActive ?? true,
        metaTitle: categoryData.metaTitle ?? null,
        metaDescription: categoryData.metaDescription ?? null,

        ...(categoryData.image && {
          image: {
            create: {
              url: categoryData.image.url,
              publicId: categoryData.image.public_id
            }
          }
        })
      }
    });
  } catch (error) {
    throw new Error(`Error creating category: ${error.message}`);
  }
};

/* ======================================
   GET CATEGORY BY ID OR SLUG
====================================== */
export const getCategoryByIdOrSlug = async (idOrSlug) => {
  try {
    const where = isNaN(Number(idOrSlug))
      ? { slug: idOrSlug }
      : { id: Number(idOrSlug) };

    const category = await prisma.category.findUnique({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        metaTitle: true,
        metaDescription: true,
        image: {
          select: { url: true }
        }
      }
    });

    if (!category) throw new Error("Category not found");
    return category;
  } catch (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }
};

/* ======================================
   UPDATE CATEGORY (NO UPLOAD)
====================================== */
export const updateCategoryById = async (id, categoryData) => {
  try {
    const categoryId = Number(id);

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true }
    });

    if (!existing) throw new Error("Category not found");

    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(categoryData.name && { name: categoryData.name }),
        ...(categoryData.slug && { slug: categoryData.slug }),
        ...(categoryData.isActive !== undefined && {
          isActive: categoryData.isActive === true || categoryData.isActive === "true"
        }),
        ...(categoryData.metaTitle !== undefined && {
          metaTitle: categoryData.metaTitle
        }),
        ...(categoryData.metaDescription !== undefined && {
          metaDescription: categoryData.metaDescription
        }),

        ...(categoryData.image && {
          image: {
            upsert: {
              create: {
                url: categoryData.image.url,
                publicId: categoryData.image.public_id
              },
              update: {
                url: categoryData.image.url,
                publicId: categoryData.image.public_id
              }
            }
          }
        })
      }
    });
  } catch (error) {
    throw new Error(`Error updating category: ${error.message}`);
  }
};

/* ======================================
   DELETE CATEGORY (TRANSACTION SAFE)
====================================== */
export const deleteCategory = async (id) => {
  const categoryId = Number(id);

  try {
    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: { id: true }
      });

      if (!category) throw new Error("Category not found");

      const [productsCount, childrenCount] = await Promise.all([
        tx.product.count({ where: { categoryId } }),
        tx.subCategory.count({ where: { categoryId } })
      ]);

      if (productsCount > 0) {
        throw new Error(
          `Cannot delete category with ${productsCount} associated products`
        );
      }

      if (childrenCount > 0) {
        throw new Error(
          `Cannot delete category with ${childrenCount} child categories`
        );
      }

      await tx.category.delete({ where: { id: categoryId } });
      return true;
    });
  } catch (error) {
    throw new Error(`Error deleting category: ${error.message}`);
  }
};
