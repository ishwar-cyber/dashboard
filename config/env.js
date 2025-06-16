import { config } from "dotenv";

config({path:`.env.${process.env.NODE_ENV || 'development'}.local`})

export const { PORT, NODE_ENV, MONGODB_URL, JWT_SECRET,JWT_EXP_IN, CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET_KEY } = process.env;