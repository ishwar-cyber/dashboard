import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    transactionOptions: {
        timeout: 15000
    }
});

export default prisma;
