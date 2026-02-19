const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users);
        const accounts = await prisma.account.findMany();
        console.log('Accounts found:', accounts);
        const sessions = await prisma.session.findMany();
        console.log('Sessions found:', sessions);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
