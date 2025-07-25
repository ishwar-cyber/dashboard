import {v4 as uuidv4 } from 'uuid';

export const generateVisitorId = () =>{
    return uuidv4();
}

export const getOrCreateVisitorId = (req, res) =>{
    let visitorId = req.cookies?.visitorId;
    if(!visitorId) {
        visitorId = generateVisitorId();

        res.cookies('visitorId', visitorId, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }
    return visitorId;
}