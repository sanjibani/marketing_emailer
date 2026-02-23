const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.template.findMany();
    let updatedCount = 0;

    for (const t of templates) {
        let body = t.body;

        // Remove " | ColdReach AI"
        body = body.replace(/ \| ColdReach AI/g, "");
        // Remove "ColdReach AI | "
        body = body.replace(/ColdReach AI \| /g, "");
        // Remove "ColdReach AI"
        body = body.replace(/ColdReach AI/g, "");

        await prisma.template.update({
            where: { id: t.id },
            data: { body }
        });
        updatedCount++;
    }

    console.log(`Updated ${updatedCount} templates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
