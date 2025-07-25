class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorHandling = (err, req, res, next)=>{
    let error = {...err};
    error.message = err.message;
    try {

        if(process.env.NODE_ENV === 'development'){
            console.log(err);   
        }

        if(err.name === 'CastError'){
            const message = 'Resource not found';
            error = new ErrorResponse(message)
            error.statusCode = 404;
        }
        // Duplicate key in Mongoose
        if(err.code === 11000){
            const message = 'Duplicate field value entred';
            error = new ErrorResponse(message)
            error.statusCode = 400;
        }
        // Validation error in Mongoose
        if(err.name === 'ValidationError'){
            const message = Object.values(err.errors).map(val=>val.message)
            error = new ErrorResponse(message.join())
            error.statusCode = 400;
        }
        // JsonWebTokenError
        if(err.name === 'JsonWebTokenError'){
            const message = 'Invalid token';
            error = new ErrorResponse(message)
            error.statusCode = 401;
        }
        // TokenExpiredError
        if(err.name === 'TokenExpiredError'){
            const message = 'Token expired';
            error = new ErrorResponse(message)
            error.statusCode = 401;
        }
        // UnauthorizedError
        if(err.name === 'UnauthorizedError'){
            const message = 'Unauthorized access';
            error = new ErrorResponse(message)
            error.statusCode = 401;
        }
        // ForbiddenError
        if(err.name === 'ForbiddenError'){
            const message = 'Forbidden access';
            error = new ErrorResponse(message)
            error.statusCode = 403;
        }
        // NotFoundError
        if(err.name === 'NotFoundError'){
            const message = 'Resource not found';
            error = new ErrorResponse(message)
            error.statusCode = 404;
        }
        // InternalServerError
        if(err.name === 'InternalServerError'){
            const message = 'Internal server error';
            error = new ErrorResponse(message)
            error.statusCode = 500;
        }
        // Set default error message and status code if not set
        if (!error.message) {
            error.message = 'Internal Server Error';
        }
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        // Send error response
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    } catch (error) {
      console.log(error);
    }
}

export default errorHandling ;