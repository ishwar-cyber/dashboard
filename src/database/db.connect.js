import prisma from "../config/prisma.js";

export const connectToPostgre = async () => {
	try {
		await prisma.$connect();
		console.log(`Connect to ${process.env.DATABASE_URL} database in development mode`);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};
