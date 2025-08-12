import {v4 as uuidv4 } from 'uuid';

export const getOrCreateVisitorId = (req, res) => {
  // 1. Check for existing visitor ID  
  let visitorId = req.cookies?.visitorId;
  
  // 2. If no ID exists, create and set a new one
  if (!visitorId) {
    visitorId = uuidv4();
    // 3. Set persistent cookie
    res.cookie('visitorId', visitorId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days expiration
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // Important for cookie accessibility
      domain: process.env.COOKIE_DOMAIN // Set this in your environment
    });
  }
  
  return visitorId;
};