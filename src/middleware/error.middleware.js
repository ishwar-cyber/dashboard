const errorHandling = (err, req, res, next)=>{
    try {
        let error = {...err};
        error.message= err.message;
        console.error(err);
        if(err.name === 'CastError'){
            const message = 'Resource not found';
            error = new Error(message)
            error.statusCode = 404;
        }
        // Duplicate key in Mongoose
        if(err.code === 11000){
            const message = 'Duplicate field value entred';
            error = new Error(message)
            error.statusCode = 400;
        }
        // Validation error in Mongoose
        if(err.name === 'ValidationError'){
            const message = Object.values(err.errors).map(val=>val.message)
            error = new Error(message.join())
            error.statusCode = 400;
        }
        res.status(error.statusCode || 500).json({success:false, error:error.message || 'Internal Server message'})
    } catch (error) {
        next(error);
    }
}

export default errorHandling;