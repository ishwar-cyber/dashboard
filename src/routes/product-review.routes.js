import {Router} from "express";
import { addProductReview, getProductReviews,  getAllProductsReviews, deleteProductReview} from "../controllers/product-review-controllers.js";
const productReviewRouter = Router();

// Define your product review routes here
// For example:
productReviewRouter.post("/", addProductReview);
productReviewRouter.get('/all', getAllProductsReviews)
productReviewRouter.get("/:productId", getProductReviews);
productReviewRouter.delete("/delete/:id", deleteProductReview)

export default productReviewRouter;