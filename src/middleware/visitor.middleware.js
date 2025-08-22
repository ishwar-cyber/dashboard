import { v4 as uuidv4 } from "uuid";

export const generateVisitorId = (req, res, next) => {
  // If user already has visitorId cookie → use it
  
  let visitorId = req.cookies?.visitorId || req.visitorId;
  if (!visitorId) {
    visitorId = uuidv4();
    res.cookie("visitorId", visitorId, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
  } else {
    console.log("Existing visitorId:", visitorId);
  }
  req.visitorId = visitorId;
  next();
};
