import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utilities/appError.js";
import Cart from "../models/cart.model.js"
import { JWT_EXP_IN, JWT_SECRET } from "../../config/env.js";

export const signUp = async (req, res, next) => {
    try {

        const { email,phone, username, password, confirmPassword, isRole } = req.body;

        // Checking if a user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUser = new User({ email, username, phone, confirmPassword, password: hashPassword, isRole })
        await newUser.save();
        newUser.password = undefined;
        // Generate JWT Token
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXP_IN });

        res.status(200).json({
            message: 'User created successfully',
            success: true,
            data: '',
        });

    } catch (error) {
        next(error);
    }
};


export const signIn = async(req, res, next)=>{
    try {

        const {username, password} = req.body;

        const user = await User.findOne({username});
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            const error = new Error('Password is not valid');
            error.statusCode = 404;
            throw error;
        }
        const token = jwt.sign({userId: user._id},JWT_SECRET,{expiresIn: JWT_EXP_IN});

        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            token,
            user:{
                _id: user._id,
                email: user.email,
                username: user.username,
                name: user.name,
                role: user.isRole,
            }
        });
    } catch (error) {
        next(error);
    }
}

export const signOut = async(req, res, next)=>{
    
}

export const userSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found, please register", 404));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError("Password is not valid", 401));
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXP_IN,
    });

    // // Set user cookie
    // res.cookie("userId", user._id, {
    //   httpOnly: true,
    //   secure: false, // true in production with https
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });
    await mergeCartAfterLogin(user._id, req.cookies.visitorId);

    res.clearCookie("visitorId");
    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.isRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

const mergeCartAfterLogin = async (userId, visitorId) => {
  if (!visitorId) return;

  const visitorCart = await Cart.findOne({ visitorId });
  if (!visitorCart) return;

  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    // no cart → just assign visitor cart to user
    visitorCart.userId = userId;
    visitorCart.visitorId = undefined;
    await visitorCart.save();
    return;
  }

  // merge carts
  for (const vItem of visitorCart.items) {
    const existing = userCart.items.find(
      (uItem) => uItem.product.toString() === vItem.product.toString()
    );
    if (existing) {
      existing.quantity += vItem.quantity;
    } else {
      userCart.items.push({
        product: vItem.product,
        name: vItem.name,
        price: vItem.price,
        quantity: vItem.quantity,
        image: vItem.image,
      });
    }
  }

  await userCart.save();
  await Cart.deleteOne({ visitorId });
};
