import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env.js";
import User from "../modules/user.modules.js";

// Middleware for authentication
const authenticate = async (req, res, next) => {
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
const roleBase = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log('whay is the role', role[0]);
        console.log('req role', req.user.isRole === role);
        
        if (req.user.isRole !== role[0]) {
            return res.status(403).json({ message: 'You do not have permission to access this resource.' });
        }
        next();
    };
};

// Export both functions
export { authenticate, roleBase };