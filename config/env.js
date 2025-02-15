import { config } from "dotenv";

config({path:`.env.${process.env.NODE_ENV || 'developement'}.local`})

export const { PORT, NODE_ENV, DB_URI, JWT_SECRET,JWT_EXP_IN } = process.env;