import { JWT_SECRET } from "../../config/env.js";
import jwt from "jsonwebtoken";
// Helper to get IDs
export async function getIds(req) {
  try {
    let userId = null;
    let visitorId = null;

    // ✅ Extract token
    const authHeader =
      req.headers.authorization ||
      req.headers.authtoken ||
      null;

    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // ✅ Decode token if present
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.userId) {
          userId = decoded.userId;
        }
      } catch (err) {
        console.warn("Invalid token:", err.message);
      }
    }

    // ✅ Fallback to visitor ID if user not logged in
    if (!userId) {
      visitorId = req.visitorId || req.cookies?.visitorId || null;
    }

    return { userId, visitorId };
  } catch (err) {
    console.error("getIds error:", err.message);
    return {
      userId: null,
      visitorId: req.visitorId || req.cookies?.visitorId || null,
    };
  }
}