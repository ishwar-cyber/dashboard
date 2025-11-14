import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  landmark: { type: String },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxLength: 255,
    },
    phone: Number,
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    confirmPassword: String,
    isRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ⭐ MULTIPLE ADDRESSES
    addresses: {
      type: [addressSchema],
    //   validate: {
    //     validator: (val) => val.length >= 2,  // Minimum 2 addresses
    //     message: "User must have at least 2 addresses",
    //   },
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
