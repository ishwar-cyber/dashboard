// middleware/error.middleware.js
export default (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    status: err.status || "error",
    message,
    // include stack only in dev mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};


// export const errorHandler = (err, req, res, next) => {
//   console.error(err);

//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error'
//   });
// };