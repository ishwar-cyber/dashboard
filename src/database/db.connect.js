import prisma from "../config/prisma.js";

export const connectToPostgre = async () => {
	try {
		await prisma.$connect();
		console.log("PostgreSQL connected via Prisma");
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};
