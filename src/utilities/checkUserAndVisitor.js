import { JWT_SECRET } from "../../config/env.js";
import jwt from "jsonwebtoken";
// Helper to get IDs
export async function getIds(req) {
  try {
    let userId = '';
    let visitorId = '';
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
        // Only pick ID, don’t fetch full user unless needed
        userId = decoded.userId;
      } catch (err) {
        console.warn("Invalid token:", err.message);
      }
    }
    // ✅ If no user, fallback to visitor
    if (!userId) {
      visitorId = req.visitorId || req.cookies?.visitorId || null;
    }

    return { userId, visitorId };
  } catch (err) {
    return { userId: null, visitorId: req.visitorId || req.cookies?.visitorId || null };
  }
}