import mongoose from "mongoose";
import { MONGODB_URL, NODE_ENV } from "../../config/env.js";

if(!MONGODB_URL){
    throw new Error("Please define the MONGODB_URI environment variable inside env.local");   
}
// mongoose.connect()

const connectToDatabse = async()=>{
    try {
        await mongoose.connect(MONGODB_URL,{
            dbName: 'e-commers'
        });
        console.log(`Connect to databse in ${NODE_ENV} mode`);
        
    } catch (error) {
        console.log('Error conneting to database:', error);
        process.exit(1);
    }
}

export default connectToDatabse;