// error.middleware.js
export default function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate key error" });
  }

  res.status(500).json({ message: "Something went wrong" });
}
