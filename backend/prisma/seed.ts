import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../src/prisma/generated/client";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

// initialize Prisma Client
const prisma = new PrismaClient({ adapter });

async function main() {
    // create two dummy users
    const user1 = await prisma.user.upsert({
        where: { email: 'sabin@adams.com' },
        update: {},
        create: {
            email: 'sabin@adams.com',
            name: 'Sabin Adams',
            passwordHash: 'password-sabin',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'alex@ruheni.com' },
        update: {},
        create: {
            email: 'alex@ruheni.com',
            name: 'Alex Ruheni',
            passwordHash: 'password-alex',
        },
    });

    console.log({ user1, user2 });
}

// execute the main function
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // close Prisma Client at the end
        await prisma.$disconnect();
    });