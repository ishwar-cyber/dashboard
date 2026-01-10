import {
  createBrand,
  getAllBrands,
} from "../services/brand.service.js";
import prisma from "../config/prisma.js";
import { deleteFile } from "../utilities/cloudnary.js";
/* ===============================
   CREATE BRAND
   (NO FUNCTIONAL CHANGE)
================================ */
export const create = async (req, res) => {
  try {
    const brandData = {
      ...req.body,
      isActive: req.body.isActive === "true"
    };

    const brand = await createBrand(brandData);

    res.status(200).json({
      success: true,
      message: "Brand is created",
      brand
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

/* ===============================
   GET ALL BRANDS
   (SAME OUTPUT)
================================ */
export const getBrands = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      featured: req.query.featured,
      active: req.query.active,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const brands = await getAllBrands(options);

    res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: brands.data
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
   GET SINGLE BRAND
   (FASTER, SAME RESULT)
================================ */
export const getBrand = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    res.status(200).json({
      success: true,
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================
   UPDATE BRAND
   (SAFE + FASTER)
================================ */
export const updateBrand = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.brand.findUnique({
      where: { id },
      include: { image: true }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    let imageData = existing.image;

    // upload only if file exists
    if (req.file) {
      const uploaded = await uploadFile(req.file.path);

      imageData = {
        url: uploaded.url,
        publicId: uploaded.public_id
      };

      // delete old image async (non-blocking)
      if (existing.image?.publicId) {
        deleteFile(existing.image.publicId).catch(() => {});
      }
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name: req.body.name,
        isActive: req.body.isActive === "true",
        image: imageData
          ? { update: imageData }
          : undefined
      }
    });

    res.status(200).json({
      success: true,
      message: "Brand is updated",
      data: {
        id: updated.id,
        name: updated.name,
        image: updated.image,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

/* ===============================
   DELETE BRAND
   (SAFE + NON-BLOCKING)
================================ */
export const deleteBrand = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // 🔹 Step 1: Get brand (to read image publicId)
    const brand = await getBrandById(id);

    // 🔹 Step 2: Delete image from Cloudinary (NON-BLOCKING)
    if (brand.image?.publicId) {
      deleteFile(brand.image.publicId).catch(() => {});
    }

    // 🔹 Step 3: Delete brand from DB
    await deleteBrandById(id);

    res.status(200).json({
      success: true,
      message: "Brand and image deleted successfully"
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

