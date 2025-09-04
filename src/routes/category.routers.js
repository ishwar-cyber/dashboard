import express from "express";
import { 
  create, 
  deleteById, 
  updateCategory, 
  getCategories, 
  getCategoryAndSubCategoryForHeader 
} from "../controllers/category.controllers.js";
import { upload } from "../middleware/multer.middlerwares.js";
import { tokenVerify, role } from "../middleware/auth.middlerwares.js";
const categoryRouter = express.Router();

/* ========= PUBLIC ROUTES ========= */
// For header menu (categories + subcategories)
categoryRouter.get("/header", getCategoryAndSubCategoryForHeader);

// Get all categories or by ID
categoryRouter.get("/", getCategories);
categoryRouter.get("/:id", getCategories); // ⚠️ Consider separate controller for byId if needed

/* ========= PROTECTED ADMIN ROUTES ========= */
categoryRouter.use(tokenVerify, role("admin"));

// Create category (with image upload)
categoryRouter.post("/", upload.single("image"), create);

// Update category
categoryRouter.put("/:id", upload.single("image"), updateCategory);

// Delete category
categoryRouter.delete("/:id", deleteById);

export default categoryRouter;