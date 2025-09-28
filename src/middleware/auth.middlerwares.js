import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env.js";
import User from "../models/user.model.js"

// Middleware for authentication
const tokenVerify = async (req, res, next) => {
    try {
        let token;
        let authToken =  req.headers.authorization ? req.headers.authorization : req.headers.authtoken ? req.headers.authtoken : null;
        if ((authToken.startsWith('Bearer'))) token = authToken.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        req.user = user; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
};

// Middleware for role-based authorization
const role = (role) => {
    return (req, res, next) => {
        console.log('Checking user role:', req.user?.isRole, 'against required role:', role);
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log('User role:',role);
        
        if (req.user.isRole !== role) {
            return res.status(403).json({ message: 'You do not have permission to access this resource.' });
        }
        next();
    };
};

// Export both functions
export { tokenVerify, role };