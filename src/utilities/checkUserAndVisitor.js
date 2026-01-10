import { JWT_SECRET } from "../../config/env.js";
import jwt from "jsonwebtoken";
// Helper to get IDs
export async function getIds1(req) {
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
    return {
      userId: null,
      visitorId: req.visitorId || req.cookies?.visitorId || null,
    };
  }
}

export const getIds = async (req) => {
  let userId = null;
  let visitorId = null;

  // 1️⃣ Try JWT (optional)
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
  } catch (err) {
    // ❗ DO NOT throw
    userId = null;
  }

  // 2️⃣ Always ensure visitorId
  if (!req.cookies.visitorId) {
    visitorId = uuidv4();
    req.res.cookie("visitorId", visitorId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });
  } else {
    visitorId = req.cookies.visitorId;
  }

  return { userId, visitorId };
};
