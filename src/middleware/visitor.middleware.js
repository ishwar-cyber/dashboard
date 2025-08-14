import { getOrCreateVisitorId } from "../utilities/visitor.js";

export const identifyVisitor = (req, res, next) =>{
    if(req.user) return next();

    const visitorId = getOrCreateVisitorId(req, res);
    req.visitorId = visitorId;
    next();
}

export const requireIdentification = (req, res, next) =>{ 
    if(!req.user && !req.visitorId){
        return req.status(401).json({
            success: false,
            message: 'User identificartion required'
        })
    }
    next();
}