import { v4 as uuidv4 } from 'uuid';

export const generateVisitorIds = (req, res, next) => {
 if (!req.cookies.visitorId) {
    const visitorId = uuidv4();
    res.cookie("visitorId", visitorId, {
      httpOnly: false,  // set to true if you don't need JS access
      secure: false,    // true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    req.visitorId = visitorId;
  } else {
    req.visitorId = req.cookies.visitorId;
  }
  next();
};