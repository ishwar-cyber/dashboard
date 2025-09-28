import Order from "../models/order.model.js";
import Product from "../models/product.model.js";


export const saleReports = async (req, res) =>{
    try {
        const reports = await Order.aggregate([
            {
                $lookup:{
                    from:"products",
                    localField:"productId",
                    foreignField:"_id",
                    as:"product"
                }
            },
            {$unwind:"$product"},
            {
                $group:{
                    _id: "$product.category",
                    totalRevenue:{$sum: {$multiply:["$quantity", "$product.price"]}},
                    totalSold:{$sum:"$quantity"}
                }
            },
            {$sort:{totalRevenue: -1}}
        ]);
        res.json(reports);
    } catch (error) {
        console.error("Aggregation error:", error);
        res.status(500).json({ message: "Error generating report", error });
    }
}

