const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Clearing 'Guessed' and 'Real' marked leads from previous steps...");
    try {
        // Delete leads where source is 'ai-research' or 'manual-research' 
        // OR where tags contain 'Guessed'.
        const { count } = await prisma.contact.deleteMany({
            where: {
                OR: [
                    { source: 'manual-research' },
                    { source: 'ai-research' },
                    { tags: { contains: '(Guessed)' } }
                ]
            }
        });
        console.log(`Deleted ${count} unverified leads.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
