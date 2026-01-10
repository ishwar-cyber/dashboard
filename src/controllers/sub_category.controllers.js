import { uploadFile, deleteFile } from "../utilities/cloudnary.js";
import {
  createSubCategory,
  updateSubCategoryById,
  getSubCategoryByIdOrSlug,
  getSubCategoryByIdService,
  deleteSubCategory,
  getAllSubCategories,
  getSubCategoriesByCategoriesService
} from "../services/subCategory.service.js";

/* ======================================
   CREATE SUBCATEGORY
====================================== */
export const create = async (req, res) => {
  try {
    const subCategoryData = {
      ...req.body,
      isActive: req.body.isActive === "true"
    };

    if (!subCategoryData.category) {
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });
    }

    const created = await createSubCategory(subCategoryData);

    res.status(201).json({
      success: true,
      message: "SubCategory added successfully",
      data: created
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   GET ALL SUBCATEGORIES
====================================== */
export const getSubCategories = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive
    };

    const result = await getAllSubCategories(options);

    res.status(200).json({
      success: true,
      message: "SubCategories fetched successfully",
      data: result.subCategories,
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
   GET SUBCATEGORY BY ID
====================================== */
export const getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await getSubCategoryByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   UPDATE SUBCATEGORY (UPLOAD HERE ONLY)
====================================== */
export const updateSubCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = {
      ...req.body,
      isActive:
        req.body.isActive === undefined
          ? undefined
          : req.body.isActive === "true"
    };

    const existing = await getSubCategoryByIdOrSlug(id);
    if (!existing) throw new Error("SubCategory not found");

    // 🔹 Upload new image if provided
    if (req.file) {
      const uploaded = await uploadFile(req.file.path);
      payload.image = {
        url: uploaded.url,
        public_id: uploaded.public_id
      };

      // 🔥 Delete old image NON-BLOCKING
      if (existing.image?.publicId) {
        deleteFile(existing.image.publicId).catch(() => {});
      }
    }

    const updated = await updateSubCategoryById(id, payload);

    res.status(200).json({
      success: true,
      message: "SubCategory updated successfully",
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
   DELETE SUBCATEGORY (CLOUDINARY + DB)
====================================== */
export const deleteById = async (req, res) => {
  try {
    const id = req.params.id;

    // 🔹 Fetch image info before delete
    const subCategory = await getSubCategoryByIdOrSlug(id);

    // 🔹 Delete from DB (transaction-safe)
    await deleteSubCategory(id);

    // 🔹 Delete Cloudinary image NON-BLOCKING
    if (subCategory.image?.publicId) {
      deleteFile(subCategory.image.publicId).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "SubCategory deleted",
      data: {}
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/* ======================================
   GET SUBCATEGORIES BY CATEGORY
====================================== */
export const getSubCategoriesByCategories = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategories = await getSubCategoriesByCategoriesService(id);

    res.status(200).json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load sub categories"
    });
  }
};
