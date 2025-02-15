import User from "../modules/user.modules.js";

export const getUser = async(req, res, next)=>{
    try {
        console.log('iuiu89797',req.params.id);
        
        const user = await User.findById(req.params.id).select('-password');
        if(!user){
            const error = new Error('User not Found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({success: true, data: user})
    } catch (error) {
        next(error);
    }
}