import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env.js";
import User from "../modules/user.modules.js";

// Middleware for authentication
const authorize = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('user id', decoded.userId);

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
        console.log('role', role);
        console.log('req.user.role', req.user.isRole);
        
        if (req.user.isRole !== role) {
            return res.status(403).json({ message: 'You do not have permission to access this resource.' });
        }
        next();
    };
};

// Export both functions
export { authorize, roleBase };