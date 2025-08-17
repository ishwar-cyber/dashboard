import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        trim: true,
        maxLength:255,
        lowercase: true,
        match:[/\S+@\S+\.\S+/, 'PLease fill a valid email address'],
    },
    phone:{
        type: Number
    },
    username:{
        type: String,
        required: [true, 'username is required']
    },
    password:{
        type: String,
        required: [true, 'user password is required'],
        minLength: 6
    },
    confirmPassword: {
        type: String,
        minLength: 6
    },
    isRole:{
        type: String,
        enum:['user','admin'],
        default: 'user'
    }
}, {timestamps: true});

const User = mongoose.model('user',userSchema)

export default User;