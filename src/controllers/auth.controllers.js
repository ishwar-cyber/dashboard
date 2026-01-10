// Using Prisma for user operations instead of Mongoose
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utilities/appError.js";
// Cart model handled via Prisma
import { JWT_EXP_IN, JWT_SECRET } from "../../config/env.js";
import prisma from "../config/prisma.js";

export const signUp = async (req, res, next) => {
    try {

        const { email,phone, username, password, confirmPassword, isRole } = req.body;

        // Checking if a user already exists
        const existingUser = await prisma.user.findUnique({where: {email}});

        if (existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hashPassword,
                phone: phone ? String(phone) : undefined,
                role: isRole === 'admin' ? 'ADMIN' : 'USER'
            }
        });
        newUser.password = undefined;
        // Generate JWT Token
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: JWT_EXP_IN });
        
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

        const user = await prisma.user.findFirst({where: {username}});
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
        const token = jwt.sign({userId: user.id},JWT_SECRET,{expiresIn: JWT_EXP_IN});

        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            token,
            user:{
                _id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                role: user.role,
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
    const user = await prisma.user.findUnique({where: {email}});
    if (!user) {
      return next(new AppError("User not found, please register", 404));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError("Password is not valid", 401));
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXP_IN,
    });

    // // Set user cookie
    // res.cookie("userId", user._id, {
    //   httpOnly: true,
    //   secure: false, // true in production with https
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });
    await mergeCartAfterLogin(user.id, req.cookies.visitorId);

    res.clearCookie("visitorId");
    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      token,
      user: {
        _id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const mergeCartAfterLogin = async (userId, visitorId) => {
  if (!visitorId) return;

  const visitorCart = await prisma.cart.findFirst({ where: { visitorId, isActive: true }, include: { items: { include: { images: true } } } });
  if (!visitorCart) return;

  let userCart = await prisma.cart.findFirst({ where: { userId, isActive: true }, include: { items: { include: { images: true } } } });
  if (!userCart) {
    // no cart → just assign visitor cart to user
    await prisma.cart.update({where: {id: visitorCart.id}, data: {userId, visitorId: null}});
    return;
  }

  // merge carts
  for (const vItem of visitorCart.items) {
    const existing = userCart.items.find(
      (uItem) => uItem.productId === vItem.productId
    );
    if (existing) {
      await prisma.cartItem.update({where: {id: existing.id}, data: {quantity: existing.quantity + vItem.quantity}});
    } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: vItem.productId,
            name: vItem.name,
            price: vItem.price,
            quantity: vItem.quantity,
            images: { create: vItem.images ? vItem.images.map((img) => ({ url: img.url || img })) : [] },
          },
        });
    }
  }

  await prisma.cart.delete({where: {id: visitorCart.id}});
};
