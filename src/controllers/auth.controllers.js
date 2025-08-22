import User from "../modules/user.modules.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utilities/appError.js";
import Cart from '../modules/cart.modules.js'
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

export const userSignInOne = async(req, res, next)=>{
    try {        
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            next(new AppError('User not found, please register', 404));
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            const error = new Error('Password is not valid');
            error.statusCode = 404;
            throw error;
        }
        const token = jwt.sign({userId:user._id},JWT_SECRET,{expiresIn: JWT_EXP_IN});
        // Set cookie
        res.cookie("userId", user._id, {
            httpOnly: true,   // can't access from JS
            secure: false,    // set to true if using https
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        await mergeCartAfterLogin(user._id, req.cookies.visitorId);
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

const mergeCartAfter = async (userId, visitorId) => {
  try { 
    console.log('visitor', visitorId, '----', userId);
    
    if (!visitorId) {
       return ({ message: "No visitor cart to merge" });
    }

    // Get visitor cart
    const visitorCart = await Cart.findOne({ visitorId });
    if (!visitorCart) {
      return ({ message: "No visitor cart found" });
    }

    // Get or create user cart
    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
      userCart = new Cart({ userId, items: [] });
    }

    // Merge items
    visitorCart.items.forEach(visitorItem => {
      const existingItem = userCart.items.find(
        item => item.product.toString() === visitorItem.product.toString()
      );
      if (existingItem) {
        existingItem.quantity += visitorItem.quantity;
      } else {
        userCart.items.push(visitorItem);
      }
    });
    console.log('user cart', userCart);
    
    // Save merged cart
    await userCart.save();

    // Delete visitor cart
    await Cart.deleteOne({ visitorId });

    return ({ message: "Cart merged successfully", cart: userCart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error merging cart" });
  }
};

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

    // Set user cookie
    res.cookie("userId", user._id, {
      httpOnly: true,
      secure: false, // true in production with https
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Merge visitor cart into user cart
    await mergeCartAfterLogin(user._id, req.cookies.visitorId);

    // Clear visitor cookie after merge
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

  // Find visitor cart
  const visitorCart = await Cart.findOne({ visitorId });
  if (!visitorCart) return;

  // Find or create user cart
  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    userCart = new Cart({ userId, items: [] });
  }

  // Merge items
  visitorCart.items.forEach((visitorItem) => {
    const existingItem = userCart.items.find(
      (item) => item.product.toString() === visitorItem.product.toString()
    );
    if (existingItem) {
      existingItem.quantity += visitorItem.quantity;
    } else {
      // clone visitor item to avoid ObjectId reference issues
      userCart.items.push({
        product: visitorItem.product,
        quantity: visitorItem.quantity,
      });
    }
  });

  // Save updated user cart
  await userCart.save();

  // Remove visitor cart
  await Cart.deleteOne({ visitorId });
};
