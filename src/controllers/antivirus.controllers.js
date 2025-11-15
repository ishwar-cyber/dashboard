import AntivirusKey from "../models/AntivirusKey.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/**
 * Helper - recalc and update product.stock based on available keys
 */
async function updateProductStock(productId) {
  const availableCount = await AntivirusKey.countDocuments({ productId, status: "available" });
  await Product.findByIdAndUpdate(productId, { stock: availableCount }, { new: true }).exec();
  return availableCount;
}

/**
 * Add multiple keys (admin)
 * Body: { keys: ["KEY1", "KEY2", ...] }
 */
export const addAntivirusKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    let { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ message: "No keys provided" });
    }

    keys = keys.map(k => k.trim()).filter(Boolean);
    const docs = keys.map(k => ({ productId, key: k, status: "available" }));

    // insertMany with ordered:false => continue on duplicate key errors
    const inserted = await AntivirusKey.insertMany(docs, { ordered: false }).catch(err => {
      // If duplicate key errors, some inserts may succeed
      if (err && err.writeErrors) {
        // ignore duplicates
        return err.insertedDocs || [];
      }
      throw err;
    });

    await updateProductStock(productId);

    return res.json({
      message: "Keys added",
      added: inserted.length || 0
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get keys for a product with pagination & filter
 * Query: ?page=1&limit=50&status=available
 */
export const getAntivirusKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, parseInt(req.query.limit || "50", 10));
    const status = req.query.status; // optional filter

    const filter = { productId };
    if (status) filter.status = status;

    const [keys, total] = await Promise.all([
      AntivirusKey.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      AntivirusKey.countDocuments(filter)
    ]);

    return res.json({
      data: keys,
      meta: { page, limit, total }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Sell one available key (atomic)
 * Body: { userEmail: "customer@example.com" }
 * Uses findOneAndUpdate to atomically claim one available key.
 */
export const sellAntivirusKey = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ message: "userEmail required" });

    // atomically find one available key and mark sold
    const key = await AntivirusKey.findOneAndUpdate(
      { productId, status: "available" },
      { $set: { status: "sold", soldTo: userEmail, soldAt: new Date() } },
      { new: true, session }
    ).exec();

    if (!key) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No available keys" });
    }

    // Update product stock based on remaining available keys
    const availableCount = await AntivirusKey.countDocuments({ productId, status: "available" }).session(session);

    await Product.findByIdAndUpdate(productId, { stock: availableCount }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ message: "Key sold", key });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a single key (admin)
 */
export const deleteAntivirusKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const key = await AntivirusKey.findByIdAndDelete(keyId);
    if (!key) return res.status(404).json({ message: "Key not found" });

    await updateProductStock(key.productId);

    return res.json({ message: "Key deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Bulk delete keys by filter (admin)
 * Body: { status: "invalid" }  // deletes all matching for productId
 */
export const bulkDeleteKeys = async (req, res) => {
  try {
    const { productId } = req.params;
    const filter = { productId, ...(req.body.status ? { status: req.body.status } : {}) };

    const result = await AntivirusKey.deleteMany(filter);
    await updateProductStock(productId);

    return res.json({ message: "Deleted", deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Optional: Recalculate stock for all products (admin)
 */
export const recalcAllProductStocks = async (req, res) => {
  try {
    const products = await Product.find({}, "_id").lean();
    const updates = [];
    for (const p of products) {
      const count = await AntivirusKey.countDocuments({ productId: p._id, status: "available" });
      updates.push(Product.findByIdAndUpdate(p._id, { stock: count }).exec());
    }
    await Promise.all(updates);
    return res.json({ message: "Stocks recalculated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
