import {
  createCategory,
  getCategoryByIdOrSlug,
  updateCategoryById,
  deleteCategory,
  getAllCategories
} from "../services/category.service.js";

import { uploadFile, deleteFile } from "../utilities/cloudnary.js";
import prisma from "../config/prisma.js";

/* ======================================
   CREATE CATEGORY (FIXED BUG)
====================================== */
export const create = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      isActive: req.body.isActive === "true"
    };

    // ✅ Create ONCE
    const category = await createCategory(categoryData);

    res.status(200).json({
      success: true,
      message: "Category added successfully",
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   GET ALL CATEGORIES (NO CHANGE)
====================================== */
export const getCategories = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive
    };

    const result = await getAllCategories(options);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result.categories,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   GET CATEGORY BY ID / SLUG
====================================== */
export const getCategoryById = async (req, res) => {
  try {
    const category = await getCategoryByIdOrSlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   UPDATE CATEGORY (NO UPLOAD HERE)
====================================== */
export const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;

    // ❌ NO uploadFile here
    // Only image metadata allowed
    const updated = await updateCategoryById(id, {
      ...req.body,
      isActive:
        req.body.isActive === undefined
          ? undefined
          : req.body.isActive === "true"
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   DELETE CATEGORY (CLOUDINARY + DB)
====================================== */
export const deleteById = async (req, res) => {
  try {
    const id = req.params.id;

    // 🔹 Get image publicId before delete
    const category = await getCategoryByIdOrSlug(id);

    // 🔹 Delete from DB (transaction-safe)
    await deleteCategory(id);

    // 🔹 Delete Cloudinary image NON-BLOCKING
    if (category.image?.publicId) {
      deleteFile(category.image.publicId).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "Category is deleted"
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   HEADER CATEGORIES (FAST)
====================================== */
export const getCategoryAndSubCategoryForHeader = async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0"
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subCategories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    const results = categories.map(cat => ({
      _id: cat.id,
      name: cat.name,
      slug: cat.slug,
      subcategories: cat.subCategories.map(s => ({
        _id: s.id,
        name: s.name,
        slug: s.slug
      }))
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

/* ======================================
   SEARCH CATEGORY (OPTIMIZED)
====================================== */
export const searchCategory = async (req, res) => {
  try {
    const query = req.query.category?.trim();
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const categories = await prisma.category.findMany({
      where: {
        name: { contains: query, mode: "insensitive" }
      },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: err.message
    });
  }
};
