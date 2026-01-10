import { uploadFile } from "../utilities/cloudnary.js";

/* ======================================
   COMMON IMAGE UPLOAD (SINGLE / MULTI)
====================================== */
export const uploadImages = async (req, res) => {
  try {
    const files = req.files?.image ||
      req.files || req.file;
    if (!files) {
      return res.status(400).json({
        success: false,
        message: "No image provided"
      });
    }

    // 🔹 Normalize to array
    const fileArray = Array.isArray(files) ? files : [files];

    // 🔥 Upload all images in parallel
    const uploadedImages = await Promise.all(
      fileArray.map(file => uploadFile(file.path))
    );

    
    // 🔹 Normalize response
    const images = uploadedImages.map(img => ({
      url: img.url,
      public_id: img.public_id
    }));

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: images.length === 1 ? images[0] : images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
