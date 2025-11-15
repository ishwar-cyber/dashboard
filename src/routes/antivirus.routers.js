import express from "express";
import {
  addAntivirusKeys,
  getAntivirusKeys,
  sellAntivirusKey,
  deleteAntivirusKey,
  bulkDeleteKeys,
  recalcAllProductStocks
} from "../controllers/antivirusKey.controllers.js";

const router = express.Router({ mergeParams: true });

// Admin: add keys
router.post("/products/:productId/keys/add", addAntivirusKeys);

// Get keys (admin)
router.get("/products/:productId/keys", getAntivirusKeys);

// Sell one key (called from order flow / payment success)
router.patch("/products/:productId/keys/sell", sellAntivirusKey);

// Delete one key
router.delete("/keys/:keyId", deleteAntivirusKey);

// Bulk delete by status
router.post("/products/:productId/keys/bulk-delete", bulkDeleteKeys);

// Recalc all stocks (admin maintenance)
router.post("/admin/recalc-stocks", recalcAllProductStocks);

export default router;
