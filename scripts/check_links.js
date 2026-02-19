const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const links = await prisma.campaignContact.findMany({
        include: {
            campaign: true,
            contact: true
        }
    });

    console.log(`Total Campaign-Contact Links: ${links.length}`);
    links.forEach(l => console.log(`- ${l.campaign.name} <-> ${l.contact.name}`));

    if (links.length === 0) {
        console.log("No links found. Attempting to link all existing contacts to 'Personal AI Tutor' campaign...");
        const campaign = await prisma.campaign.findFirst({
            where: { name: { contains: 'Personal AI Tutor' } }
        });

        if (campaign) {
            const contacts = await prisma.contact.findMany({ where: { deletedAt: null } });
            for (const contact of contacts) {
                await prisma.campaignContact.create({
                    data: {
                        campaignId: campaign.id,
                        contactId: contact.id
                    }
                });
                console.log(`Linked ${contact.name} to ${campaign.name}`);
            }
        } else {
            console.log("Campaign not found.");
        }
    }
}

main();
