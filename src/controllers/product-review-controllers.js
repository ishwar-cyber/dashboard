
import ProductReview from "../models/product-review.model.js"
export const addProductReview = async (req, res) => {
    try {
        const { productId, name, comment, email, rating } = req.body;
        const newReview = new ProductReview({ productId, name, email, comment, rating });
        await newReview.save();
        return res.status(201).json({ message: "Review added", review: newReview });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await ProductReview.find({ productId }).sort({ createdAt: -1 }).lean(); ;

    // Total reviews
    const totalReviews = reviews.length;

    // Average rating
    const averageRating =
      totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(averageRating),
      reviews,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const deleteProductReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        await ProductReview.findByIdAndDelete(reviewId);
        return res.status(200).json({ message: "Review deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};  