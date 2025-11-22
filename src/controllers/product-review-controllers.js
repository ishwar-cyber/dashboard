
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
        const { id } = req.params;
        await ProductReview.findByIdAndDelete(id);
        return res.status(200).json({ message: "Review deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};  

export const getAllProductsReviews = async (req, res) => {
  try {
    // Query params
    const {
      page = 1,
      limit = 10,
      productId,
      rating,
      status,
      startDate,
      endDate
    } = req.query;

    const skip = (page - 1) * limit;

    // Mongo Filter Object
    const match = {};

    if (productId) match.productId = new mongoose.Types.ObjectId(productId);
    if (rating) match.rating = Number(rating);
    if (status) match.status = status;

    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59")
      };
    }

    // Aggregation
    const reviews = await ProductReview.aggregate([
      { $match: match },

      // Join Product
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },

      // Sort latest
      { $sort: { createdAt: -1 } },

      // Pagination
      { $skip: skip },
      { $limit: Number(limit) },

      // Shape response
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          rating: 1,
          comment: 1,
          status: 1,
          createdAt: 1,

          productId: "$product._id",
          productName: "$product.name",
          productImage: { $arrayElemAt: ["$product.images.url", 0] },
          productPrice: "$product.price"
        }
      }
    ]);

    // Count Total
    const totalReviews = await ProductReview.countDocuments(match);

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      reviews
    });

  } catch (error) {
    console.error("Review Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
