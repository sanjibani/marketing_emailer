const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Personal AI Tutor - High Ticket" },
        include: { stats: true }
    });

    console.log("Campaign Status:", campaign.status);
    console.log("Scheduled For:", campaign.scheduledAt);
}

main();
