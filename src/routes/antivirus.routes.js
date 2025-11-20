import express from "express";
import {
  addAntivirusKeys,
  getAntivirusKeys,
  sellAntivirusKey,
  deleteAntivirusKey,
  bulkDeleteKeys,
  recalcAllProductStocks
} from "../controllers/antivirus.controllers.js";

const antivirusRouter = express.Router();

// Admin: add keys
antivirusRouter.post("/add/:productId/", addAntivirusKeys);

// Get keys (admin)
antivirusRouter.get("/products/:productId/keys", getAntivirusKeys);

// Sell one key (called from order flow / payment success)
antivirusRouter.patch("/products/:productId/keys/sell", sellAntivirusKey);

// Delete one key
antivirusRouter.delete("/keys/:keyId", deleteAntivirusKey);

// Bulk delete by status
antivirusRouter.post("/products/:productId/keys/bulk-delete", bulkDeleteKeys);

// Recalc all stocks (admin maintenance)
antivirusRouter.post("/admin/recalc-stocks", recalcAllProductStocks);

export default antivirusRouter;
