import { v4 as uuidv4 } from "uuid";

export const generateVisitorId = (req, res, next) => {
  // If user already has visitorId cookie → use it
  let visitorId = req.cookies?.visitorId;

  if (!visitorId) {
    // ✅ Generate new one
    visitorId = uuidv4();

    // ✅ Save in cookies (HTTP only for security)
    res.cookie("visitorId", visitorId, {
      httpOnly: true,     // cannot access via JS
      secure: true,       // only over HTTPS
      sameSite: "strict", // prevents CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    console.log("New visitorId created:", visitorId);
  } else {
    console.log("Existing visitorId:", visitorId);
  }

  req.visitorId = visitorId;
  next();
};
