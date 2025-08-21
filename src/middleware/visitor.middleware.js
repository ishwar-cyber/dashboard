import { v4 as uuidv4 } from "uuid";

export const generateVisitorId = (req, res, next) => {
  // If user already has visitorId cookie → use it
  
  let visitorId = req.cookies?.visitorId || req.visitorId;
  console.log('visitoredrttyy',visitorId);

  if (!visitorId) {
    // ✅ Generate new one
    visitorId = uuidv4();

    // ✅ Save in cookies (HTTP only for security)
    res.cookie("visitorId", visitorId, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
    console.log("New visitorId created:", visitorId);
  } else {
    console.log("Existing visitorId:", visitorId);
  }

  req.visitorId = visitorId;
  next();
};
