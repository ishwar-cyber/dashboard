import { v4 as uuidv4 } from 'uuid';

export const generateVisitorIds = (req, res, next) => {
  // Check if visitorId exists in cookies
  let visitorId = req.cookies.visitorId;
  if (!visitorId) {
    // Create new visitor ID
    visitorId = uuidv4();
    res.cookie('visitorId', visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
    });
  }
  // Make it available to request
  req.visitorId = visitorId;
  next();
};