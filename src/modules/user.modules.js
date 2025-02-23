import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,'User name is required'],
    },
    email:{
        type: String,
        required: true,
        trim: true,
        maxLength:255,
        lowercase: true,
        match:[/\S+@\S+\.\S+/, 'PLease fill a valid email address'],
    },
    password:{
        type: String,
        required: [true, 'user password is required'],
        minLength: 6
    },
    isAdmin:{
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const User = mongoose.model('user',userSchema)

export default User;