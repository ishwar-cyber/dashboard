import {Router} from "express";
import { addProductReview, getProductReviews } from "../controllers/product-review-controllers.js";
const productReviewRouter = Router();

// Define your product review routes here
// For example:
productReviewRouter.post("/", addProductReview);
productReviewRouter.get("/:productId", getProductReviews);

export default productReviewRouter;